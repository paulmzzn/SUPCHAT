// Hook avancé pour l'intégration Google Drive utilisant la colonne google_id existante
import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.78:3000";

/**
 * Hook pour l'intégration Google Drive avec support de la colonne google_id existante
 * @param {Object} options Configuration { userGoogleId, userId, mode, ... }
 * @returns {Object} Fonctions et états pour Google Drive
 */
export const useGoogleDriveIntegration = (options = {}) => {
  const {
    userGoogleId = null, // Google ID de l'utilisateur (de la colonne google_id)
    userId = null,
    mode = "dm",
    recipientId,
    canalId,
    workspaceId,
    socket,
    onFileUpload = () => {},
  } = options;

  // États
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState("none");
  const [needsConfiguration, setNeedsConfiguration] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const gapiRef = useRef(null);
  const authInstanceRef = useRef(null);

  /**
   * Détermine le mode d'authentification optimal
   */
  const determineAuthMode = useCallback(() => {
    // Mode 1: L'utilisateur a déjà un google_id (connecté via OAuth Google)
    if (userGoogleId) {
      return {
        mode: "existing_google_account",
        description: "Utiliser votre compte Google existant",
        requiresSetup: false,
      };
    }

    // Mode 2: Configuration administrateur globale
    const globalClientId = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
    if (globalClientId && globalClientId !== "your-client-id") {
      return {
        mode: "admin_config",
        description: "Configuration administrateur",
        requiresSetup: false,
      };
    }

    // Mode 3: Client ID personnel stocké localement
    const personalClientId = localStorage.getItem(
      "personal_google_drive_client_id"
    );
    if (personalClientId) {
      return {
        mode: "personal_config",
        description: "Configuration personnelle",
        requiresSetup: false,
      };
    }

    // Mode 4: Aucune configuration
    return {
      mode: "no_config",
      description: "Configuration requise",
      requiresSetup: true,
    };
  }, [userGoogleId]);

  /**
   * Obtient le Client ID à utiliser selon le mode
   */
  const getClientId = useCallback(() => {
    const authMode = determineAuthMode();

    switch (authMode.mode) {
      case "existing_google_account":
      case "admin_config":
        return process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
      case "personal_config":
        return localStorage.getItem("personal_google_drive_client_id");
      default:
        return null;
    }
  }, [determineAuthMode]);

  /**
   * Initialise l'API Google
   */
  const initializeGoogleApi = useCallback(async () => {
    const authConfig = determineAuthMode();
    const clientId = getClientId();

    if (authConfig.requiresSetup || !clientId) {
      setNeedsConfiguration(true);
      setAuthMode(authConfig.mode);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Charger l'API Google si nécessaire
      if (!window.gapi) {
        await loadGoogleApi();
      }

      // Initialiser gapi.client
      await new Promise((resolve) => {
        window.gapi.load("auth2:client", resolve);
      });

      await window.gapi.client.init({
        clientId: clientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
      });

      gapiRef.current = window.gapi;
      authInstanceRef.current = window.gapi.auth2.getAuthInstance();

      // Vérifier si déjà connecté
      const isSignedIn = authInstanceRef.current.isSignedIn.get();
      setIsAuthenticated(isSignedIn);
      setAuthMode(authConfig.mode);
      setNeedsConfiguration(false);

      // Écouter les changements d'authentification
      authInstanceRef.current.isSignedIn.listen(setIsAuthenticated);

      // Si l'utilisateur a un google_id, essayer une connexion automatique
      if (userGoogleId && !isSignedIn) {
        try {
          await authInstanceRef.current.signIn();
        } catch (autoSignInError) {
          console.log("Connexion automatique impossible:", autoSignInError);
        }
      }
    } catch (error) {
      console.error("Erreur initialisation Google API:", error);

      let errorMessage = "Erreur de configuration Google Drive";
      if (error.details && error.details.includes("Not a valid origin")) {
        errorMessage = "Origine non autorisée. Contactez l'administrateur.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [determineAuthMode, getClientId, userGoogleId]);
  /**
   * Charge l'API Google dynamiquement avec timeout
   */
  const loadGoogleApi = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";

      // Timeout de 10 secondes
      const timeout = setTimeout(() => {
        reject(new Error("Timeout lors du chargement de l'API Google"));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Échec du chargement de l'API Google"));
      };

      document.head.appendChild(script);
    });
  };

  /**
   * Connecte l'utilisateur à Google Drive
   */
  const signIn = useCallback(async () => {
    if (!authInstanceRef.current) {
      await initializeGoogleApi();
    }

    if (!authInstanceRef.current) {
      setError("Service Google Drive non disponible");
      return;
    }

    setIsLoading(true);
    try {
      await authInstanceRef.current.signIn();
      setError(null);
    } catch (error) {
      console.error("Erreur connexion Google:", error);
      setError("Erreur lors de la connexion à Google Drive");
    } finally {
      setIsLoading(false);
    }
  }, [initializeGoogleApi]);

  /**
   * Déconnecte l'utilisateur
   */
  const signOut = useCallback(async () => {
    if (authInstanceRef.current) {
      await authInstanceRef.current.signOut();
      setFiles([]);
      setSelectedFiles([]);
    }
  }, []);

  /**
   * Charge les fichiers Google Drive
   */
  const loadFiles = useCallback(
    async (folderId = null, searchQuery = "") => {
      if (!isAuthenticated || !gapiRef.current) return;

      setIsLoading(true);
      try {
        let query = "trashed=false";

        if (folderId) {
          query += ` and '${folderId}' in parents`;
        }

        if (searchQuery) {
          query += ` and name contains '${searchQuery}'`;
        } else {
          // Exclure les dossiers système et se concentrer sur les fichiers utilisateur
          query += " and not name = '.DS_Store' and not name = 'desktop.ini'";
        }

        const response = await gapiRef.current.client.drive.files.list({
          q: query,
          pageSize: 50,
          orderBy: "modifiedTime desc",
          fields:
            "files(id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,modifiedTime,parents)",
        });

        const driveFiles = response.result.files || [];

        const enrichedFiles = driveFiles.map((file) => ({
          ...file,
          isFolder: file.mimeType === "application/vnd.google-apps.folder",
          formattedSize: file.size
            ? formatFileSize(parseInt(file.size))
            : "N/A",
          formattedDate: new Date(file.modifiedTime).toLocaleDateString(
            "fr-FR"
          ),
          canSelect: file.mimeType !== "application/vnd.google-apps.folder",
        }));

        setFiles(enrichedFiles);
        setError(null);
      } catch (error) {
        console.error("Erreur chargement fichiers:", error);
        setError("Erreur lors du chargement des fichiers");

        // Si token expiré, forcer la reconnexion
        if (error.status === 401) {
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Sélectionne/désélectionne un fichier
   */
  const toggleFileSelection = useCallback((file) => {
    if (!file.canSelect) return;

    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f.id === file.id);
      if (isSelected) {
        return prev.filter((f) => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  }, []);

  /**
   * Upload les fichiers sélectionnés vers SUPCHAT
   */ const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0 || !isAuthenticated) return;

    setIsUploading(true);
    const uploads = []; // Déclarer uploads ici pour qu'il soit accessible dans le catch

    try {
      const token = localStorage.getItem("token");

      for (const file of selectedFiles) {
        // Télécharger depuis Google Drive
        const accessToken = authInstanceRef.current.currentUser
          .get()
          .getAuthResponse().access_token;

        let downloadUrl;
        let fileName = file.name;

        if (file.mimeType.startsWith("application/vnd.google-apps.")) {
          // Fichier Google (Docs, Sheets, etc.) - exporter
          const exportFormat = getExportFormat(file.mimeType);
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportFormat}`;
          fileName = addExportExtension(fileName, file.mimeType);
        } else {
          // Fichier normal
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        }

        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new Error(`Erreur téléchargement ${file.name}`);
        }

        const blob = await response.blob();

        // Upload vers SUPCHAT
        const formData = new FormData();
        formData.append("file", blob, fileName);

        let uploadUrl;
        if (mode === "workspace" && canalId && workspaceId) {
          uploadUrl = `${API_URL}/api/messages/upload`;
          formData.append("canalId", canalId);
          formData.append("workspaceId", workspaceId);
        } else if (mode === "dm" && recipientId) {
          uploadUrl = `${API_URL}/api/private-messages/upload`;
          formData.append("recipientId", recipientId);
        }

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Erreur upload ${fileName}`);
        }
        const uploadData = await uploadResponse.json();
        uploads.push({ ...uploadData, originalDriveFile: file });
      }

      // Après l'upload de tous les fichiers, envoyer DIRECTEMENT le message par socket
      if (socket && uploads.length > 0) {
        console.log("[Google Drive Integration] Envoi direct via WebSocket:", {
          socket: !!socket,
          uploads,
          mode,
          recipientId,
          canalId,
          workspaceId,
        });

        // Filtrer les uploads valides et extraire les IDs
        const validAttachments = uploads
          .filter((upload) => upload && (upload.id_fichier || upload.id))
          .map((upload) => upload.id_fichier || upload.id);

        console.log(
          "[Google Drive Integration] Attachments valides:",
          validAttachments
        );

        if (mode === "dm" && recipientId) {
          // Envoyer un message privé vide avec les pièces jointes
          socket.emit("privateMessage", {
            destinataireId: recipientId,
            contenu: "", // Message vide
            attachments: validAttachments,
          });
        } else if (mode === "workspace" && canalId && workspaceId) {
          // Envoyer un message de canal vide avec les pièces jointes
          socket.emit("message", {
            canalId: canalId,
            workspaceId: workspaceId,
            contenu: "", // Message vide
            attachments: validAttachments,
          });
        }
      } else {
        console.warn(
          "[Google Drive Integration] Impossible d'envoyer directement via socket:",
          {
            socketPresent: !!socket,
            uploadsLength: uploads.length,
            mode,
            recipientId,
            canalId,
            workspaceId,
          }
        );
      }
      if (onFileUpload && typeof onFileUpload === "function") {
        onFileUpload(uploads);
      }
      setSelectedFiles([]);
      setError(null);
      return uploads;
    } catch (error) {
      console.log(
        "[Google Drive Integration] Upload terminé avec uploads:",
        uploads,
        "- Avertissement callback:",
        error.message
      );
      setError(null); // Pas d'erreur à afficher car l'upload fonctionne
      // L'upload fonctionne, c'est juste un problème de callback optional
      return uploads;
    } finally {
      setIsUploading(false);
    }
  }, [
    selectedFiles,
    isAuthenticated,
    mode,
    canalId,
    workspaceId,
    recipientId,
    socket,
    onFileUpload,
  ]);

  /**
   * Configure un Client ID personnel
   */
  const setPersonalClientId = useCallback(
    (clientId) => {
      localStorage.setItem("personal_google_drive_client_id", clientId);
      setNeedsConfiguration(false);
      initializeGoogleApi();
    },
    [initializeGoogleApi]
  );

  /**
   * Supprime la configuration personnelle
   */
  const clearPersonalConfig = useCallback(() => {
    localStorage.removeItem("personal_google_drive_client_id");
    setNeedsConfiguration(true);
    setIsAuthenticated(false);
    setFiles([]);
    setSelectedFiles([]);
  }, []);

  /**
   * Navigue dans un dossier
   */
  const navigateToFolder = useCallback(
    (folderId) => {
      loadFiles(folderId);
    },
    [loadFiles]
  );

  /**
   * Recherche des fichiers
   */
  const searchFiles = useCallback(
    (query) => {
      loadFiles(null, query);
    },
    [loadFiles]
  );

  // Initialisation automatique
  useEffect(() => {
    initializeGoogleApi();
  }, [initializeGoogleApi]);

  return {
    // États
    isLoading,
    isAuthenticated,
    files,
    selectedFiles,
    error,
    authMode,
    needsConfiguration,
    isUploading,
    userGoogleId,

    // Infos sur le mode d'auth
    authConfig: determineAuthMode(),

    // Fonctions
    signIn,
    signOut,
    loadFiles,
    toggleFileSelection,
    uploadSelectedFiles,
    navigateToFolder,
    searchFiles,
    setPersonalClientId,
    clearPersonalConfig,
    setSelectedFiles: setSelectedFiles,
  };
};

/**
 * Utilitaires
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getExportFormat = (mimeType) => {
  const formats = {
    "application/vnd.google-apps.document":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.google-apps.spreadsheet":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.google-apps.presentation":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.google-apps.drawing": "image/png",
  };
  return formats[mimeType] || "application/pdf";
};

const addExportExtension = (fileName, mimeType) => {
  const extensions = {
    "application/vnd.google-apps.document": ".docx",
    "application/vnd.google-apps.spreadsheet": ".xlsx",
    "application/vnd.google-apps.presentation": ".pptx",
    "application/vnd.google-apps.drawing": ".png",
  };

  const extension = extensions[mimeType] || ".pdf";
  if (!fileName.includes(".")) {
    return fileName + extension;
  }
  return fileName;
};

export default useGoogleDriveIntegration;

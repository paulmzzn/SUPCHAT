// Hook réutilisable pour l'intégration Google Drive
import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.29:3000";

// Configuration Google Drive API
const GOOGLE_DRIVE_CONFIG = {
  // Option 1: Configuration par l'administrateur (recommandé pour la production)
  apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
  clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,

  discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  scope: "https://www.googleapis.com/auth/drive.readonly",
};

// Vérification de la configuration
const isConfigurationValid = () => {
  // Vérifier d'abord le Client ID personnel stocké localement
  const personalClientId = localStorage.getItem("google_drive_client_id");
  if (personalClientId) {
    return { valid: true, mode: "auth-only", clientId: personalClientId };
  }

  // Si on a une config complète (API Key + Client ID)
  if (
    GOOGLE_DRIVE_CONFIG.apiKey &&
    GOOGLE_DRIVE_CONFIG.clientId &&
    GOOGLE_DRIVE_CONFIG.apiKey !== "your-api-key" &&
    GOOGLE_DRIVE_CONFIG.clientId !== "your-client-id"
  ) {
    return {
      valid: true,
      mode: "full",
      clientId: GOOGLE_DRIVE_CONFIG.clientId,
    };
  }

  // Si on a juste un Client ID dans l'env
  if (
    GOOGLE_DRIVE_CONFIG.clientId &&
    GOOGLE_DRIVE_CONFIG.clientId !== "your-client-id"
  ) {
    return {
      valid: true,
      mode: "auth-only",
      clientId: GOOGLE_DRIVE_CONFIG.clientId,
    };
  }

  return { valid: false, mode: "none", clientId: null };
};

/**
 * Hook pour gérer l'intégration Google Drive
 * @param {Object} options - Configuration { mode: 'dm' | 'workspace', recipientId, canalId, workspaceId, socket }
 * @returns {Object} - Fonctions et états pour Google Drive
 */
export const useGoogleDrive = (options = {}) => {
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [configurationError, setConfigurationError] = useState(null);
  const [authMode, setAuthMode] = useState("none"); // "full", "auth-only", "none"
  const [needsSetup, setNeedsSetup] = useState(false);
  const gapiInitialized = useRef(false);

  const {
    mode = "dm",
    recipientId,
    canalId,
    workspaceId,
    socket,
    setMessages = () => {},
    setNewMessage = () => {},
    setReplyingTo = () => {},
    onFileUpload = () => {},
  } = options;
  /**
   * Initialise l'API Google Drive
   */
  const initializeGoogleApi = useCallback(async () => {
    if (gapiInitialized.current) return;

    // Vérifier la configuration avant d'initialiser
    const configCheck = isConfigurationValid();
    if (!configCheck.valid) {
      setNeedsSetup(true);
      return;
    }

    setAuthMode(configCheck.mode);

    try {
      // Charger l'API Google si pas déjà fait
      if (!window.gapi) {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
          window.gapi.load("auth2:client", () =>
            initGapi(configCheck.clientId)
          );
        };
        document.head.appendChild(script);
      } else {
        window.gapi.load("auth2:client", () => initGapi(configCheck.clientId));
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'API Google:", error);
      setConfigurationError("Erreur lors du chargement de l'API Google Drive");
    }
  }, []);
  const initGapi = useCallback(async (clientId) => {
    try {
      const configCheck = isConfigurationValid();

      // Configuration selon le mode disponible
      const initConfig = {
        clientId: clientId,
        scope: GOOGLE_DRIVE_CONFIG.scope,
      };

      // Ajouter l'API Key seulement si elle est disponible
      if (configCheck.mode === "full" && GOOGLE_DRIVE_CONFIG.apiKey) {
        initConfig.apiKey = GOOGLE_DRIVE_CONFIG.apiKey;
        initConfig.discoveryDocs = [GOOGLE_DRIVE_CONFIG.discoveryDoc];
      }

      await window.gapi.client.init(initConfig);

      const authInstance = window.gapi.auth2.getAuthInstance();
      setIsSignedIn(authInstance.isSignedIn.get());
      setIsGoogleApiLoaded(true);
      setConfigurationError(null);
      setNeedsSetup(false);
      gapiInitialized.current = true;

      // Écouter les changements d'authentification
      authInstance.isSignedIn.listen(setIsSignedIn);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'API Google:", error);
      let errorMessage = "Erreur lors de l'initialisation de Google Drive";

      if (error.details && error.details.includes("Not a valid origin")) {
        errorMessage =
          "Origine non autorisée. Veuillez ajouter http://localhost:3001 dans les origines autorisées de votre projet Google Cloud Console.";
      }

      setConfigurationError(errorMessage);
    }
  }, []);

  /**
   * Connecte l'utilisateur à Google Drive
   */
  const signInToGoogle = useCallback(async () => {
    if (!isGoogleApiLoaded) return;

    setIsAuthenticating(true);
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isGoogleApiLoaded]);

  /**
   * Déconnecte l'utilisateur de Google Drive
   */
  const signOutFromGoogle = useCallback(async () => {
    if (!isGoogleApiLoaded) return;

    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setDriveFiles([]);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Erreur lors de la déconnexion Google:", error);
    }
  }, [isGoogleApiLoaded]);
  /**
   * Récupère la liste des fichiers Google Drive
   */
  const loadDriveFiles = useCallback(
    async (folderId = null, query = "") => {
      if (!isSignedIn || !isGoogleApiLoaded) return;

      setIsLoadingFiles(true);
      try {
        let searchQuery = "trashed=false";

        if (folderId) {
          searchQuery += ` and '${folderId}' in parents`;
        } else if (!query) {
          // Par défaut, afficher les fichiers récents
          searchQuery +=
            " and (mimeType contains 'image/' or mimeType contains 'application/' or mimeType contains 'text/' or mimeType contains 'video/' or mimeType contains 'audio/')";
        }

        if (query) {
          searchQuery += ` and name contains '${query}'`;
        }

        let response;

        if (authMode === "full") {
          // Mode complet avec API Key - utiliser gapi.client
          response = await window.gapi.client.drive.files.list({
            q: searchQuery,
            pageSize: 50,
            orderBy: "modifiedTime desc",
            fields:
              "files(id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,modifiedTime,parents)",
          });
        } else {
          // Mode auth-only - utiliser les requêtes directes avec le token d'accès
          const accessToken = window.gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .getAuthResponse().access_token;

          const apiResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?` +
              new URLSearchParams({
                q: searchQuery,
                pageSize: 50,
                orderBy: "modifiedTime desc",
                fields:
                  "files(id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,modifiedTime,parents)",
              }),
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!apiResponse.ok) {
            throw new Error(
              `Erreur API: ${apiResponse.status} ${apiResponse.statusText}`
            );
          }

          response = {
            result: await apiResponse.json(),
          };
        }

        const files = response.result.files || [];

        // Ajouter des informations supplémentaires pour chaque fichier
        const enrichedFiles = files.map((file) => ({
          ...file,
          isFolder: file.mimeType === "application/vnd.google-apps.folder",
          formattedSize: file.size
            ? formatFileSize(parseInt(file.size))
            : "N/A",
          formattedDate: new Date(file.modifiedTime).toLocaleDateString(
            "fr-FR"
          ),
        }));

        setDriveFiles(enrichedFiles);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers Drive:", error);
        if (error.status === 401) {
          // Token expiré, demander une nouvelle authentification
          setIsSignedIn(false);
        }
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [isSignedIn, isGoogleApiLoaded, authMode]
  );

  /**
   * Sélectionne/désélectionne un fichier
   */
  const toggleFileSelection = useCallback((file) => {
    if (file.isFolder) return; // Empêcher la sélection des dossiers

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
   * Navigue dans un dossier
   */
  const navigateToFolder = useCallback(
    (folderId) => {
      loadDriveFiles(folderId);
    },
    [loadDriveFiles]
  );

  /**
   * Télécharge un fichier depuis Google Drive et l'envoie
   */
  const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const uploads = [];

      for (const file of selectedFiles) {
        // Télécharger le fichier depuis Google Drive
        const accessToken = window.gapi.auth2
          .getAuthInstance()
          .currentUser.get()
          .getAuthResponse().access_token;

        let downloadUrl = "";
        if (file.mimeType.startsWith("application/vnd.google-apps.")) {
          // Pour les fichiers Google (Docs, Sheets, etc.), exporter en format approprié
          const exportFormat = getExportFormat(file.mimeType);
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportFormat}`;
        } else {
          // Pour les fichiers normaux
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        }

        const response = await fetch(downloadUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement de ${file.name}`);
        }

        const blob = await response.blob();

        // Créer un FormData pour l'upload vers notre serveur
        const formData = new FormData();
        formData.append("file", blob, file.name);

        let uploadUrl = "";
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(
            `Erreur lors de l'upload de ${file.name}: ${errorText}`
          );
        }

        const uploadData = await uploadResponse.json();
        uploads.push({
          ...uploadData,
          originalDriveFile: file,
        });
      }

      // Notifier le succès et nettoyer
      onFileUpload(uploads);
      setSelectedFiles([]);

      return uploads;
    } catch (error) {
      console.error(
        "Erreur lors de l'upload des fichiers Google Drive:",
        error
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, mode, canalId, workspaceId, recipientId, onFileUpload]);

  /**
   * Recherche des fichiers
   */
  const searchFiles = useCallback(
    (query) => {
      loadDriveFiles(null, query);
    },
    [loadDriveFiles]
  );

  /**
   * Configure un Client ID personnalisé
   */
  const setPersonalClientId = useCallback(
    (clientId) => {
      localStorage.setItem("google_drive_client_id", clientId);
      // Réinitialiser l'API avec le nouveau Client ID
      gapiInitialized.current = false;
      setIsGoogleApiLoaded(false);
      setIsSignedIn(false);
      setNeedsSetup(false);
      setConfigurationError(null);
      initializeGoogleApi();
    },
    [initializeGoogleApi]
  );

  /**
   * Supprime la configuration personnalisée
   */
  const clearPersonalConfig = useCallback(() => {
    localStorage.removeItem("google_drive_client_id");
    gapiInitialized.current = false;
    setIsGoogleApiLoaded(false);
    setIsSignedIn(false);
    setNeedsSetup(true);
    setConfigurationError(null);
  }, []);

  // Initialiser l'API au montage du composant
  useEffect(() => {
    initializeGoogleApi();
  }, [initializeGoogleApi]);
  return {
    // États
    isGoogleApiLoaded,
    isSignedIn,
    isAuthenticating,
    driveFiles,
    isLoadingFiles,
    selectedFiles,
    isUploading,
    configurationError,
    authMode,
    needsSetup,

    // Fonctions
    signInToGoogle,
    signOutFromGoogle,
    loadDriveFiles,
    toggleFileSelection,
    navigateToFolder,
    uploadSelectedFiles,
    searchFiles,
    setSelectedFiles,
    setPersonalClientId,
    clearPersonalConfig,
  };
};

/**
 * Utilitaires
 */

// Format des tailles de fichier
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Formats d'export pour les fichiers Google
const getExportFormat = (mimeType) => {
  const exportFormats = {
    "application/vnd.google-apps.document":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.google-apps.spreadsheet":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.google-apps.presentation":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.google-apps.drawing": "image/png",
  };

  return exportFormats[mimeType] || "application/pdf";
};

export default useGoogleDrive;

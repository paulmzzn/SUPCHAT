// Hook réutilisable pour l'intégration Google Drive
import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.72:3000";

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
  console.log("🔍 [Google Drive] Vérification de la configuration...");
  console.log("🔍 [Google Drive] Variables d'environnement:", {
    REACT_APP_GOOGLE_DRIVE_API_KEY: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
    REACT_APP_GOOGLE_DRIVE_CLIENT_ID:
      process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
  });

  // ⚠️ TEMPORAIRE : Nettoyer l'ancien Client ID du localStorage pour forcer l'utilisation du nouveau
  const personalClientId = localStorage.getItem("google_drive_client_id");
  if (
    personalClientId &&
    personalClientId !== process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID
  ) {
    console.log(
      "🧹 [Google Drive] Nettoyage de l'ancien Client ID du localStorage:",
      personalClientId
    );
    localStorage.removeItem("google_drive_client_id");
  }

  console.log(
    "🔍 [Google Drive] Client ID personnel stocké:",
    localStorage.getItem("google_drive_client_id")
  );

  // Priorité au Client ID de l'environnement maintenant
  if (
    GOOGLE_DRIVE_CONFIG.clientId &&
    GOOGLE_DRIVE_CONFIG.clientId !== "your-client-id"
  ) {
    console.log(
      "✅ [Google Drive] Utilisation du Client ID de l'environnement:",
      GOOGLE_DRIVE_CONFIG.clientId
    );
    return {
      valid: true,
      mode: "auth-only",
      clientId: GOOGLE_DRIVE_CONFIG.clientId,
    };
  }

  // Vérifier le Client ID personnel stocké localement en dernier recours
  const storedClientId = localStorage.getItem("google_drive_client_id");
  if (storedClientId) {
    console.log("✅ [Google Drive] Utilisation du Client ID personnel stocké");
    return { valid: true, mode: "auth-only", clientId: storedClientId };
  }

  // Si on a une config complète (API Key + Client ID)
  if (
    GOOGLE_DRIVE_CONFIG.apiKey &&
    GOOGLE_DRIVE_CONFIG.clientId &&
    GOOGLE_DRIVE_CONFIG.apiKey !== "your-api-key" &&
    GOOGLE_DRIVE_CONFIG.clientId !== "your-client-id"
  ) {
    console.log(
      "✅ [Google Drive] Configuration complète détectée (API Key + Client ID)"
    );
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
    console.log(
      "✅ [Google Drive] Client ID détecté dans l'environnement:",
      GOOGLE_DRIVE_CONFIG.clientId
    );
    return {
      valid: true,
      mode: "auth-only",
      clientId: GOOGLE_DRIVE_CONFIG.clientId,
    };
  }

  console.log("❌ [Google Drive] Aucune configuration valide trouvée");
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
  const [error, setError] = useState(null);
  const gapiInitialized = useRef(false);
  const authInstanceRef = useRef(null);

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
   * Initialise l'API Google Drive avec la nouvelle Google Identity Services (GIS)
   */
  const initializeGoogleApi = useCallback(async () => {
    console.log(
      "🚀 [Google Drive] Début d'initialisation de l'API Google (GIS)"
    );

    if (gapiInitialized.current) {
      console.log("⚠️ [Google Drive] API déjà initialisée, abandon");
      return;
    }

    // Vérifier la configuration avant d'initialiser
    const configCheck = isConfigurationValid();
    console.log(
      "🔧 [Google Drive] Résultat de la vérification de config:",
      configCheck
    );

    if (!configCheck.valid) {
      console.log(
        "❌ [Google Drive] Configuration invalide, activation du mode setup"
      );
      setNeedsSetup(true);
      return;
    }

    setAuthMode(configCheck.mode);
    console.log("📋 [Google Drive] Mode d'authentification:", configCheck.mode);
    try {
      // Charger les scripts Google Identity Services et API avec timeout
      await Promise.race([
        Promise.all([
          loadScript("https://accounts.google.com/gsi/client"),
          loadScript("https://apis.google.com/js/api.js"),
        ]),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout de chargement API")),
            10000
          )
        ),
      ]);

      console.log("✅ [Google Drive] Scripts GIS et API chargés");

      // Initialiser Google API client avec timeout
      await Promise.race([
        new Promise((resolve) => {
          window.gapi.load("client", resolve);
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout d'initialisation gapi.client")),
            5000
          )
        ),
      ]);

      // Initialiser le client avec la configuration
      await window.gapi.client.init({
        discoveryDocs: [GOOGLE_DRIVE_CONFIG.discoveryDoc],
      });

      console.log("✅ [Google Drive] Client API initialisé");

      // Initialiser Google Identity Services
      initGoogleIdentity(configCheck.clientId);
    } catch (error) {
      console.error(
        "❌ [Google Drive] Erreur lors du chargement de l'API Google:",
        error
      );
      setConfigurationError("Erreur lors du chargement de l'API Google Drive");
    }
  }, []); // Fonction utilitaire pour charger les scripts
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Initialise Google Identity Services
  const initGoogleIdentity = useCallback((clientId) => {
    console.log(
      "🔧 [Google Drive] Initialisation Google Identity Services avec Client ID:",
      clientId
    );

    try {
      // Initialiser Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      // Initialiser le client OAuth2 pour les scopes d'API
      window.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_DRIVE_CONFIG.scope,
        callback: handleTokenResponse,
      });

      setIsGoogleApiLoaded(true);
      setConfigurationError(null);
      setNeedsSetup(false);
      gapiInitialized.current = true;

      console.log(
        "✅ [Google Drive] Google Identity Services initialisé avec succès"
      );
    } catch (error) {
      console.error(
        "❌ [Google Drive] Erreur lors de l'initialisation GIS:",
        error
      );
      setConfigurationError(
        "Erreur lors de l'initialisation de Google Identity Services"
      );
    }
  }, []);

  // Gestion de la réponse d'authentification
  const handleCredentialResponse = useCallback((response) => {
    console.log("🔐 [Google Drive] Réponse d'authentification reçue");
    // Pour l'instant, on utilise principalement le token OAuth2 pour les API
  }, []); // Gestion de la réponse du token OAuth2
  const handleTokenResponse = useCallback((response) => {
    console.log("🔐 [Google Drive] Token OAuth2 reçu");
    if (response.access_token) {
      localStorage.setItem("google_access_token", response.access_token);

      // Stocker l'expiration du token (par défaut 3600 secondes = 1 heure)
      const expiryTime = Date.now() + (response.expires_in || 3600) * 1000;
      localStorage.setItem("google_token_expiry", expiryTime.toString());

      setIsSignedIn(true);
      setIsAuthenticating(false);
      console.log(
        "✅ [Google Drive] Utilisateur authentifié avec succès, token expire le:",
        new Date(expiryTime)
      );
    } else {
      console.error("❌ [Google Drive] Pas de token d'accès reçu");
      setIsSignedIn(false);
      setIsAuthenticating(false);
    }
  }, []);
  /**
   * Connecte l'utilisateur à Google Drive avec redirection dans un nouvel onglet
   */
  const signInToGoogle = useCallback(async () => {
    if (!isGoogleApiLoaded) return;

    setIsAuthenticating(true);
    try {
      console.log(
        "🔐 [Google Drive] Demande d'authentification OAuth2 avec redirection"
      );

      // Utiliser le nouveau client OAuth2 avec redirection dans un nouvel onglet
      if (window.googleTokenClient) {
        window.googleTokenClient.requestAccessToken({
          prompt: "select_account", // Permettre la sélection du compte
          ux_mode: "redirect", // Utiliser la redirection au lieu d'une popup
          redirect_uri: window.location.origin + window.location.pathname, // Retourner sur la même page
        });
      } else {
        throw new Error("Client OAuth2 non initialisé");
      }
    } catch (error) {
      console.error("❌ [Google Drive] Erreur lors de la connexion:", error);
      setIsAuthenticating(false);
    }
    // Note: setIsAuthenticating(false) sera appelé dans handleTokenResponse
  }, [isGoogleApiLoaded]);

  /**
   * Déconnecte l'utilisateur de Google Drive
   */
  const signOutFromGoogle = useCallback(async () => {
    if (!isGoogleApiLoaded) return;
    try {
      // Révoquer le token d'accès
      const accessToken = localStorage.getItem("google_access_token");
      if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken);
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_token_expiry");
      }

      setIsSignedIn(false);
      setDriveFiles([]);
      setSelectedFiles([]);
      console.log("✅ [Google Drive] Déconnexion réussie");
    } catch (error) {
      console.error("❌ [Google Drive] Erreur lors de la déconnexion:", error);
    }
  }, [isGoogleApiLoaded]);
  /**
   * Récupère la liste des fichiers Google Drive
   */
  const loadDriveFiles = useCallback(
    async (folderId = null, query = "") => {
      try {
        // Vérifier si l'utilisateur est authentifié AVANT d'essayer de charger les fichiers
        if (!isSignedIn) {
          console.log(
            "❌ [Google Drive] Utilisateur non connecté, impossible de charger les fichiers"
          );
          setError(
            "Vous devez vous connecter à Google Drive pour accéder à vos fichiers"
          );
          setDriveFiles([]);
          setIsLoadingFiles(false);
          return;
        }

        setIsLoadingFiles(true);
        setError(null);

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

        // Vérifier que le token est encore valide avant de faire la requête
        const accessToken = localStorage.getItem("google_access_token");
        const tokenExpiry = localStorage.getItem("google_token_expiry");

        if (
          !accessToken ||
          !tokenExpiry ||
          Date.now() >= parseInt(tokenExpiry)
        ) {
          console.log(
            "❌ [Google Drive] Token expiré ou manquant, reconnexion nécessaire"
          );
          setError(
            "Votre session Google Drive a expiré. Veuillez vous reconnecter."
          );
          setIsSignedIn(false);
          setDriveFiles([]);
          setIsLoadingFiles(false);
          return;
        }

        if (authMode === "full") {
          response = await window.gapi.client.drive.files.list({
            q: searchQuery,
            pageSize: 50,
            orderBy: "modifiedTime desc",
            fields:
              "files(id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,modifiedTime,parents)",
          });
        } else {
          // Mode auth-only : utiliser l'API REST directement
          const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            searchQuery
          )}&pageSize=50&orderBy=modifiedTime desc&fields=${encodeURIComponent(
            "files(id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,modifiedTime,parents)"
          )}`;

          const apiResponse = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!apiResponse.ok) {
            if (apiResponse.status === 401) {
              console.log("❌ [Google Drive] Token invalide ou expiré (401)");
              setError(
                "Votre session Google Drive a expiré. Veuillez vous reconnecter."
              );
              setIsSignedIn(false);
              setDriveFiles([]);
              setIsLoadingFiles(false);
              return;
            }
            throw new Error(`Erreur API: ${apiResponse.status}`);
          }

          response = { result: await apiResponse.json() };
        }
        const files = response.result.files || [];
        console.log(`✅ [Google Drive] ${files.length} fichiers chargés`);
        setDriveFiles(files);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers Drive:", error); // Si c'est une erreur 401, c'est probablement un token expiré
        if (error.message.includes("401")) {
          setError(
            "Votre session Google Drive a expiré. Veuillez vous reconnecter."
          );
          setIsSignedIn(false);
        } else {
          setError(`Erreur lors du chargement: ${error.message}`);
        }
        setDriveFiles([]);
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
    const uploads = []; // Déclarer uploads ici pour qu'il soit accessible dans le catch

    try {
      const token = localStorage.getItem("token");
      for (const file of selectedFiles) {
        // Télécharger le fichier depuis Google Drive
        const accessToken = localStorage.getItem("google_access_token");

        if (!accessToken) {
          throw new Error(
            "Token d'accès non disponible. Veuillez vous reconnecter."
          );
        }

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

      // Après l'upload de tous les fichiers, envoyer DIRECTEMENT le message par socket
      if (socket && uploads.length > 0) {
        console.log("[Google Drive] Envoi direct via WebSocket:", {
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

        console.log("[Google Drive] Attachments valides:", validAttachments);

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
          "[Google Drive] Impossible d'envoyer directement via socket:",
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

      // Notifier le succès et nettoyer
      if (onFileUpload && typeof onFileUpload === "function") {
        onFileUpload(uploads);
      }
      setSelectedFiles([]);

      return uploads;
    } catch (error) {
      console.log(
        "[Google Drive] Upload terminé avec uploads:",
        uploads,
        "- Avertissement callback:",
        error.message
      );
      // L'upload fonctionne, c'est juste un problème de callback optional
      return uploads;
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
  }, []); // Initialiser l'API au montage du composant
  useEffect(() => {
    // Vérifier si un token d'accès existe déjà et s'il est valide
    const existingToken = localStorage.getItem("google_access_token");
    const tokenExpiry = localStorage.getItem("google_token_expiry");

    if (existingToken && tokenExpiry) {
      const now = Date.now();
      const expiryTime = parseInt(tokenExpiry);

      if (now < expiryTime) {
        console.log(
          "🔍 [Google Drive] Token d'accès valide trouvé, connexion automatique"
        );
        setIsSignedIn(true);
      } else {
        console.log("🔍 [Google Drive] Token expiré, nettoyage");
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_token_expiry");
        setIsSignedIn(false);
      }
    }

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
    error,

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

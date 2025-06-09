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
  const [isLoading, setIsLoading] = useState(false); // Ajouter cette ligne manquante
  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [configurationError, setConfigurationError] = useState(null);
  const [authMode, setAuthMode] = useState("none");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState(null);
  const gapiInitialized = useRef(false);
  const authInstanceRef = useRef(null);
  const tokenClient = useRef(null);

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
      // Initialiser Google Identity Services avec les bons scopes
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleTokenResponse,
        scope:
          "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file", // Ajouter les scopes Drive
      });

      // Initialiser le client OAuth2 pour les scopes Drive
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file",
        callback: (tokenResponse) => {
          console.log("🔐 [Google Drive] Token OAuth2 reçu", tokenResponse);

          if (tokenResponse.access_token) {
            // Stocker le token avec une expiration
            const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
            localStorage.setItem(
              "google_access_token",
              tokenResponse.access_token
            );
            localStorage.setItem(
              "google_token_expires_at",
              expiresAt.toString()
            );

            setIsSignedIn(true);
            setIsAuthenticating(false);

            console.log(
              "✅ [Google Drive] Utilisateur authentifié avec succès, token expire le:",
              new Date(expiresAt)
            );
          }
        },
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
    if (!tokenClient.current) {
      console.error("❌ [Google Drive] Client OAuth2 non initialisé");
      setError("Erreur d'initialisation de l'authentification Google");
      return;
    }

    try {
      setIsAuthenticating(true);
      setError(null);

      console.log("🔐 [Google Drive] Demande d'autorisation OAuth2...");

      // Demander l'autorisation avec les scopes Drive
      tokenClient.current.requestAccessToken({
        prompt: "consent", // Forcer l'affichage du consentement pour s'assurer que tous les scopes sont accordés
      });
    } catch (error) {
      console.error("❌ [Google Drive] Erreur lors de la connexion:", error);
      setError("Erreur lors de la connexion à Google Drive");
      setIsAuthenticating(false);
    }
  }, []);

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
        localStorage.removeItem("google_token_expires_at");
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
        // Vérifier si l'utilisateur est authentifié
        if (!isSignedIn) {
          console.log("❌ [Google Drive] Utilisateur non connecté");
          setError(
            "Vous devez vous connecter à Google Drive pour accéder à vos fichiers"
          );
          setDriveFiles([]);
          setIsLoadingFiles(false);
          return;
        }

        // Vérifier que le token est disponible et valide
        const accessToken = localStorage.getItem("google_access_token");
        const tokenExpiry = localStorage.getItem("google_token_expires_at");

        if (!accessToken) {
          console.log("❌ [Google Drive] Aucun token d'accès trouvé");
          setError("Session expirée, veuillez vous reconnecter");
          setIsSignedIn(false);
          setDriveFiles([]);
          setIsLoadingFiles(false);
          return;
        }

        // Vérifier l'expiration du token
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
          console.log("❌ [Google Drive] Token expiré");
          setError(
            "Votre session Google Drive a expiré. Veuillez vous reconnecter."
          );
          setIsSignedIn(false);
          localStorage.removeItem("google_access_token");
          localStorage.removeItem("google_token_expires_at");
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
          // Par défaut, afficher les fichiers récents (pas seulement certains types)
          searchQuery +=
            " and (mimeType contains 'image/' or mimeType contains 'application/' or mimeType contains 'text/' or mimeType contains 'video/' or mimeType contains 'audio/' or mimeType='application/vnd.google-apps.folder')";
        }

        if (query) {
          searchQuery += ` and name contains '${query}'`;
        }

        console.log("🔍 [Google Drive] Recherche avec query:", searchQuery);

        // Utiliser l'API REST Google Drive
        const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          searchQuery
        )}&pageSize=50&orderBy=modifiedTime desc&fields=${encodeURIComponent(
          "files(id,name,mimeType,size,thumbnailLink,webViewLink,webContentLink,modifiedTime,parents)"
        )}`;

        console.log("🌐 [Google Drive] URL API:", apiUrl);

        const apiResponse = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log(
          "📡 [Google Drive] Réponse API:",
          apiResponse.status,
          apiResponse.statusText
        );

        if (!apiResponse.ok) {
          if (apiResponse.status === 401) {
            console.log("❌ [Google Drive] Token invalide ou expiré (401)");
            setError(
              "Votre session Google Drive a expiré. Veuillez vous reconnecter."
            );
            setIsSignedIn(false);
            localStorage.removeItem("google_access_token");
            localStorage.removeItem("google_token_expires_at");
            setDriveFiles([]);
            setIsLoadingFiles(false);
            return;
          } else if (apiResponse.status === 403) {
            console.log(
              "❌ [Google Drive] Accès refusé (403) - Permissions insuffisantes"
            );
            setError(
              "Permissions insuffisantes pour accéder à Google Drive. Veuillez vous reconnecter et accorder les permissions nécessaires."
            );
            setDriveFiles([]);
            setIsLoadingFiles(false);
            return;
          }
          throw new Error(
            `Erreur API: ${apiResponse.status} ${apiResponse.statusText}`
          );
        }

        const data = await apiResponse.json();
        const files = data.files || [];

        console.log(`✅ [Google Drive] ${files.length} fichiers chargés`);

        // Traitement des fichiers pour ajouter les propriétés formatées
        const processedFiles = files.map((file) => ({
          ...file,
          isFolder: file.mimeType === "application/vnd.google-apps.folder",
          formattedSize: file.size
            ? formatFileSize(parseInt(file.size))
            : "Taille inconnue",
          formattedDate: file.modifiedTime
            ? new Date(file.modifiedTime).toLocaleDateString()
            : "Date inconnue",
        }));

        setDriveFiles(processedFiles);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers Drive:", error);
        setError(`Erreur lors du chargement: ${error.message}`);
        setDriveFiles([]);
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [isSignedIn]
  );

  /**
   * Sélectionne/désélectionne un fichier
   */
  const toggleFileSelection = useCallback(
    (file) => {
      if (selectedFiles.find((f) => f.id === file.id)) {
        setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
      } else {
        setSelectedFiles([...selectedFiles, file]);
      }
    },
    [selectedFiles]
  );

  /**
   * Télécharge les fichiers sélectionnés
   */
  const downloadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError("Aucun fichier sélectionné pour le téléchargement");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Télécharger chaque fichier sélectionné
      for (const file of selectedFiles) {
        if (file.isFolder) {
          console.warn(
            "📁 [Google Drive] Ignorer le téléchargement d'un dossier:",
            file.name
          );
          continue; // Ignorer les dossiers, gérer le téléchargement des fichiers uniquement
        }

        console.log("⬇️ [Google Drive] Téléchargement du fichier:", file.name);

        // Utiliser l'API REST pour télécharger le fichier
        const apiUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const accessToken = localStorage.getItem("google_access_token");

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Erreur lors du téléchargement de ${file.name}: ${response.statusText}`
          );
        }

        // Créer un lien temporaire pour le téléchargement
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Créer un élément <a> pour déclencher le téléchargement
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = file.name || "fichier_sans_nom";
        document.body.appendChild(a);
        a.click();

        // Nettoyer
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log("✅ [Google Drive] Fichier téléchargé:", file.name);
      }

      setSelectedFiles([]);
    } catch (error) {
      console.error("❌ [Google Drive] Erreur lors du téléchargement:", error);
      setError(`Erreur lors du téléchargement: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles]);

  /**
   * Supprime les fichiers sélectionnés
   */
  const deleteSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError("Aucun fichier sélectionné pour la suppression");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ces fichiers ?")) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Supprimer chaque fichier sélectionné
      for (const file of selectedFiles) {
        console.log("🗑️ [Google Drive] Suppression du fichier:", file.name);

        // Utiliser l'API REST pour supprimer le fichier
        const apiUrl = `https://www.googleapis.com/drive/v3/files/${file.id}`;
        const accessToken = localStorage.getItem("google_access_token");

        const response = await fetch(apiUrl, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Erreur lors de la suppression de ${file.name}: ${response.statusText}`
          );
        }

        console.log("✅ [Google Drive] Fichier supprimé:", file.name);
      }

      setSelectedFiles([]);
      loadDriveFiles(); // Recharger la liste des fichiers
    } catch (error) {
      console.error("❌ [Google Drive] Erreur lors de la suppression:", error);
      setError(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, loadDriveFiles]);

  /**
   * Crée un nouveau dossier dans Google Drive
   */
  const createFolder = useCallback(
    async (folderName) => {
      if (!folderName) {
        setError("Le nom du dossier ne peut pas être vide");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        // Créer le dossier dans le répertoire racine par défaut
        const apiUrl = `https://www.googleapis.com/drive/v3/files`;
        const accessToken = localStorage.getItem("google_access_token");

        // Utiliser l'API REST pour créer un dossier
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Erreur lors de la création du dossier: ${response.statusText}`
          );
        }

        const newFolder = await response.json();
        console.log("✅ [Google Drive] Dossier créé:", newFolder.name);

        // Recharger les fichiers pour afficher le nouveau dossier
        loadDriveFiles();
      } catch (error) {
        console.error(
          "❌ [Google Drive] Erreur lors de la création du dossier:",
          error
        );
        setError(`Erreur lors de la création du dossier: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    },
    [loadDriveFiles]
  );

  // Ajouter la fonction uploadSelectedFiles
  const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      console.log("❌ [Google Drive] Aucun fichier sélectionné");
      return [];
    }

    setIsUploading(true);
    const uploads = [];

    try {
      const token = localStorage.getItem("token");
      const accessToken = localStorage.getItem("google_access_token");

      if (!token) {
        throw new Error("Token d'authentification SUPCHAT manquant");
      }

      if (!accessToken) {
        throw new Error("Token Google Drive manquant");
      }
      console.log(
        `🚀 [Google Drive] Début de l'upload de ${selectedFiles.length} fichier(s)`
      );

      for (const file of selectedFiles) {
        console.log(`📤 [Google Drive] Upload du fichier: ${file.name}`);
        console.log(`📄 [Google Drive] Type de fichier: ${file.mimeType}`);

        // Vérifier si c'est un fichier Google Docs/Sheets/Slides
        if (
          file.mimeType &&
          file.mimeType.startsWith("application/vnd.google-apps.")
        ) {
          console.warn(
            `⚠️ [Google Drive] Fichier Google Apps détecté (${file.mimeType}), conversion en cours...`
          );

          // Déterminer le format d'export approprié
          let exportMimeType = "application/pdf"; // Par défaut PDF
          let fileExtension = ".pdf";

          if (file.mimeType === "application/vnd.google-apps.document") {
            exportMimeType =
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            fileExtension = ".docx";
          } else if (
            file.mimeType === "application/vnd.google-apps.spreadsheet"
          ) {
            exportMimeType =
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            fileExtension = ".xlsx";
          } else if (
            file.mimeType === "application/vnd.google-apps.presentation"
          ) {
            exportMimeType =
              "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            fileExtension = ".pptx";
          }

          console.log(`📤 [Google Drive] Export en ${exportMimeType}`);

          // Utiliser l'API d'export pour les fichiers Google Apps
          const apiUrl = `https://www.googleapis.com/drive/v3/files/${
            file.id
          }/export?mimeType=${encodeURIComponent(exportMimeType)}`;

          const downloadResponse = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!downloadResponse.ok) {
            console.error(
              `❌ [Google Drive] Erreur export ${file.name}:`,
              downloadResponse.status,
              downloadResponse.statusText
            );
            throw new Error(
              `Erreur lors de l'export de ${file.name}: ${downloadResponse.statusText}`
            );
          }

          const fileBlob = await downloadResponse.blob();
          console.log(
            `✅ [Google Drive] Fichier exporté: ${file.name} (${fileBlob.size} bytes)`
          );

          // Créer FormData avec le fichier exporté et une extension appropriée
          const fileName = file.name.includes(".")
            ? file.name
            : file.name + fileExtension;
          const formData = new FormData();
          formData.append("file", fileBlob, fileName);

          // Continuer avec l'upload...
          let uploadUrl;
          if (mode === "workspace" && canalId && workspaceId) {
            uploadUrl = `${API_URL}/api/messages/upload`;
            formData.append("canalId", canalId);
            formData.append("workspaceId", workspaceId);
          } else if (mode === "dm" && recipientId) {
            uploadUrl = `${API_URL}/api/private-messages/upload`;
            formData.append("recipientId", recipientId);
          } else {
            throw new Error("Configuration d'upload invalide");
          }

          console.log(`📡 [Google Drive] Upload vers SUPCHAT: ${uploadUrl}`);

          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(
              `❌ [Google Drive] Erreur upload ${fileName}:`,
              uploadResponse.status,
              errorText
            );
            throw new Error(
              `Erreur upload ${fileName}: ${uploadResponse.status} - ${errorText}`
            );
          }

          const uploadData = await uploadResponse.json();
          uploads.push({ ...uploadData, originalDriveFile: file });

          console.log(
            `✅ [Google Drive] Fichier ${fileName} uploadé avec succès`
          );

          continue; // Passer au fichier suivant
        }

        // Étape 1: Télécharger le fichier depuis Google Drive (fichiers normaux)
        console.log(
          `⬇️ [Google Drive] Téléchargement du fichier depuis Google Drive...`
        );
        const apiUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

        const downloadResponse = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!downloadResponse.ok) {
          console.error(
            `❌ [Google Drive] Erreur téléchargement ${file.name}:`,
            downloadResponse.status,
            downloadResponse.statusText
          );
          throw new Error(
            `Erreur lors du téléchargement de ${file.name}: ${downloadResponse.statusText}`
          );
        }

        const fileBlob = await downloadResponse.blob();
        console.log(
          `✅ [Google Drive] Fichier téléchargé: ${file.name} (${fileBlob.size} bytes)`
        );

        // Étape 2: Créer FormData avec le fichier téléchargé
        const fileName = file.name;
        const formData = new FormData();
        formData.append("file", fileBlob, fileName);

        let uploadUrl;
        if (mode === "workspace" && canalId && workspaceId) {
          uploadUrl = `${API_URL}/api/messages/upload`;
          formData.append("canalId", canalId);
          formData.append("workspaceId", workspaceId);
        } else if (mode === "dm" && recipientId) {
          uploadUrl = `${API_URL}/api/private-messages/upload`;
          formData.append("recipientId", recipientId);
        } else {
          throw new Error("Configuration d'upload invalide");
        }

        console.log(`📡 [Google Drive] Upload vers SUPCHAT: ${uploadUrl}`);

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(
            `❌ [Google Drive] Erreur upload ${fileName}:`,
            uploadResponse.status,
            errorText
          );
          throw new Error(
            `Erreur upload ${fileName}: ${uploadResponse.status} - ${errorText}`
          );
        }

        const uploadData = await uploadResponse.json();
        uploads.push({ ...uploadData, originalDriveFile: file });

        console.log(
          `✅ [Google Drive] Fichier ${fileName} uploadé avec succès`
        );
      }

      console.log(
        `🎉 [Google Drive] Upload terminé: ${uploads.length} fichier(s) envoyé(s)`
      );

      // Déclencher le callback
      if (onFileUpload && uploads.length > 0) {
        onFileUpload(uploads);
      }

      // Réinitialiser les fichiers sélectionnés
      setSelectedFiles([]);

      return uploads;
    } catch (error) {
      console.error("❌ [Google Drive] Erreur lors de l'upload:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, mode, canalId, workspaceId, recipientId, onFileUpload]);

  /**
   * Navigue vers un dossier spécifique
   */
  const navigateToFolder = useCallback(
    (folder) => {
      if (folder && folder.isFolder) {
        console.log(
          `📁 [Google Drive] Navigation vers le dossier: ${folder.name}`
        );
        loadDriveFiles(folder.id);
      }
    },
    [loadDriveFiles]
  );

  /**
   * Recherche des fichiers par nom
   */
  const searchFiles = useCallback(
    (query) => {
      console.log(`🔍 [Google Drive] Recherche: ${query}`);
      loadDriveFiles(null, query);
    },
    [loadDriveFiles]
  );

  /**
   * Définit un Client ID personnel
   */
  const setPersonalClientId = useCallback(
    (clientId) => {
      console.log(
        `🔧 [Google Drive] Configuration du Client ID personnel: ${clientId}`
      );
      localStorage.setItem("google_drive_client_id", clientId);
      setNeedsSetup(false);
      // Relancer l'initialisation avec le nouveau Client ID
      initializeGoogleApi();
    },
    [initializeGoogleApi]
  );

  /**
   * Efface la configuration personnelle
   */
  const clearPersonalConfig = useCallback(() => {
    console.log(
      `🧹 [Google Drive] Suppression de la configuration personnelle`
    );
    localStorage.removeItem("google_drive_client_id");
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_token_expires_at");
    setNeedsSetup(true);
    setIsSignedIn(false);
    setDriveFiles([]);
    setSelectedFiles([]);
  }, []);

  /**
   * Fonction utilitaire pour formater la taille des fichiers
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Fonction utilitaire pour formater la date
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  /**
   * Fonction utilitaire pour gérer les erreurs
   */
  const handleError = (error) => {
    console.error("Erreur:", error);
    setError(error.message || "Une erreur est survenue");
  };

  // Améliorer la gestion du token avec une vérification de validité
  const checkTokenValidity = useCallback(async () => {
    const token = localStorage.getItem("google_access_token");
    const expiryTime = localStorage.getItem("google_token_expiry");

    if (!token || !expiryTime) {
      return false;
    }

    // Vérifier si le token a expiré (avec une marge de 5 minutes)
    const now = Date.now();
    const expiry = parseInt(expiryTime);
    const fiveMinutes = 5 * 60 * 1000;

    if (now >= expiry - fiveMinutes) {
      // Token expiré, le supprimer
      localStorage.removeItem("google_access_token");
      localStorage.removeItem("google_token_expiry");
      return false;
    }

    return true;
  }, []);

  // Modifier l'initialisation pour vérifier automatiquement le token
  useEffect(() => {
    const initializeGoogleDrive = async () => {
      const configCheck = isConfigurationValid();

      if (!configCheck.valid) {
        setError("Configuration Google Drive manquante");
        setNeedsSetup(true);
        return;
      }

      try {
        setIsLoading(true);

        // Vérifier d'abord si on a un token valide en localStorage
        const hasValidToken = await checkTokenValidity();
        if (hasValidToken) {
          setIsSignedIn(true);
          console.log("✅ [Google Drive] Token valide trouvé en localStorage");
          return;
        }

        console.log(
          "🔄 [Google Drive] Aucun token valide, initialisation nécessaire"
        );
      } catch (error) {
        console.error("❌ [Google Drive] Erreur d'initialisation:", error);
        setError("Erreur lors de l'initialisation de Google Drive");
      } finally {
        setIsLoading(false);
      }
    };

    initializeGoogleDrive();
  }, [checkTokenValidity]); // Garder checkTokenValidity comme dépendance

  // Effet pour initialiser l'API Google Drive au montage du composant
  useEffect(() => {
    initializeGoogleApi();
  }, [initializeGoogleApi]);

  // Ajouter un effet pour vérifier périodiquement la validité du token
  useEffect(() => {
    if (!isSignedIn) return;

    const interval = setInterval(async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        console.log("🔄 [Google Drive] Token expiré, déconnexion automatique");
        setIsSignedIn(false);
        setDriveFiles([]);
        setSelectedFiles([]);
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(interval);
  }, [isSignedIn, checkTokenValidity]);

  return {
    isGoogleApiLoaded,
    isSignedIn,
    isAuthenticating,
    isLoading, // Ajouter isLoading au return
    driveFiles,
    isLoadingFiles,
    selectedFiles,
    isUploading,
    configurationError,
    needsSetup,
    error,
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
    checkTokenValidity, // Ajouter checkTokenValidity pour l'utiliser dans les composants
  };
};

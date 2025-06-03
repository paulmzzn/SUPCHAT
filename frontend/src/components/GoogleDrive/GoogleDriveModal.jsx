import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaFolder,
  FaFile,
  FaImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaVideo,
  FaMusic,
  FaSearch,
  FaArrowLeft,
  FaCheck,
  FaSpinner,
  FaGoogle,
  FaCloudDownloadAlt,
  FaPaperPlane,
  FaFileArchive,
  FaFileCode,
  FaGoogleDrive, // Import manquant ajouté
} from "react-icons/fa";
import useGoogleDrive from "../../hooks/useGoogleDrive";
import GoogleDriveSetup from "./GoogleDriveSetup";
import "./GoogleDriveModal.css";

// Fonctions utilitaires pour les fichiers
const getFileIconClass = (mimeType) => {
  if (mimeType === "application/vnd.google-apps.folder") return "folder";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "excel";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "powerpoint";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return "archive";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("css") ||
    mimeType.includes("html")
  )
    return "code";
  return "document";
};

const getFileIcon = (mimeType) => {
  if (mimeType === "application/vnd.google-apps.folder") return <FaFolder />;
  if (mimeType.startsWith("image/")) return <FaImage />;
  if (mimeType === "application/pdf") return <FaFilePdf />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FaFileWord />;
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return <FaFileExcel />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return <FaFilePowerpoint />;
  if (mimeType.startsWith("video/")) return <FaVideo />;
  if (mimeType.startsWith("audio/")) return <FaMusic />;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return <FaFileArchive />;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("css") ||
    mimeType.includes("html")
  )
    return <FaFileCode />;
  return <FaFileAlt />;
};

const getFileTypeFromMime = (mimeType) => {
  if (mimeType === "application/vnd.google-apps.folder") return "DOSSIER";
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLSX";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "PPT";
  if (mimeType.startsWith("video/")) return "VIDÉO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return "ARCHIVE";
  if (mimeType.includes("javascript")) return "JS";
  if (mimeType.includes("json")) return "JSON";
  if (mimeType.includes("css")) return "CSS";
  if (mimeType.includes("html")) return "HTML";
  return "FICHIER";
};

// Fonction pour obtenir l'élément React sous forme de string (pour innerHTML)
const getFileIconElement = (mimeType) => {
  const iconMap = {
    "application/vnd.google-apps.folder": "📁",
    image: "🖼️",
    pdf: "📄",
    word: "📝",
    excel: "📊",
    powerpoint: "📋",
    video: "🎥",
    audio: "🎵",
    archive: "📦",
    code: "💻",
  };

  if (mimeType === "application/vnd.google-apps.folder")
    return iconMap["application/vnd.google-apps.folder"];
  if (mimeType.startsWith("image/")) return iconMap["image"];
  if (mimeType === "application/pdf") return iconMap["pdf"];
  if (mimeType.includes("word") || mimeType.includes("document"))
    return iconMap["word"];
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return iconMap["excel"];
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return iconMap["powerpoint"];
  if (mimeType.startsWith("video/")) return iconMap["video"];
  if (mimeType.startsWith("audio/")) return iconMap["audio"];
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return iconMap["archive"];
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("css") ||
    mimeType.includes("html")
  )
    return iconMap["code"];
  return "📄";
};

/**
 * Composant modal pour sélectionner des fichiers depuis Google Drive
 */
const GoogleDriveModal = ({
  isOpen, // Changé de 'show' à 'isOpen' pour uniformité avec les autres composants
  onClose,
  onFilesSelected,
  mode = "dm", // 'dm' ou 'workspace'
  recipientId,
  canalId,
  workspaceId,
  socket,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const {
    isGoogleApiLoaded,
    isSignedIn,
    isAuthenticating,
    driveFiles,
    isLoadingFiles,
    selectedFiles,
    isUploading,
    configurationError,
    needsSetup,
    error, // Ajouter cette ligne pour récupérer l'erreur du hook
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
  } = useGoogleDrive({
    mode,
    recipientId,
    canalId,
    workspaceId,
    socket,
    onFileUpload: (uploads) => {
      onFilesSelected(uploads);
      // Ne pas appeler onClose() ici car c'est géré dans handleUploadFiles
    },
  });
  // Charger les fichiers quand le modal s'ouvre et que l'utilisateur est connecté
  useEffect(() => {
    if (isOpen && isSignedIn && isGoogleApiLoaded) {
      loadDriveFiles();
    }
  }, [isOpen, isSignedIn, isGoogleApiLoaded, loadDriveFiles]);
  // Gérer la fermeture du modal avec animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSearchQuery("");
      setCurrentFolder(null);
      setFolderHistory([]);
      setSelectedFiles([]);
      setIsClosing(false);
      onClose();
    }, 300); // Durée de l'animation de fermeture
  };

  // Gérer la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchFiles(searchQuery.trim());
    } else {
      loadDriveFiles();
    }
  };

  // Naviguer dans un dossier
  const handleFolderClick = (folder) => {
    setFolderHistory((prev) => [...prev, currentFolder]);
    setCurrentFolder(folder);
    navigateToFolder(folder.id);
  };

  // Revenir au dossier précédent
  const handleBackClick = () => {
    const previousFolder = folderHistory[folderHistory.length - 1];
    setFolderHistory((prev) => prev.slice(0, -1));
    setCurrentFolder(previousFolder);

    if (previousFolder) {
      navigateToFolder(previousFolder.id);
    } else {
      loadDriveFiles();
    }
  }; // Gérer l'upload des fichiers sélectionnés
  const handleUploadFiles = async () => {
    try {
      const uploads = await uploadSelectedFiles();
      console.log("[GoogleDriveModal] Upload réussi:", uploads);

      // Fermer le modal avec animation après l'upload
      handleClose();
    } catch (error) {
      console.error("Erreur critique lors de l'upload:", error);
      // Ne pas afficher d'alert sauf si c'est vraiment critique
      if (
        error.message.includes("critique") ||
        error.message.includes("réseau")
      ) {
        alert("Erreur lors de l'upload des fichiers: " + error.message);
      }
    }
  };

  if (!isOpen) return null;
  return (
    <div
      className={`google-drive-modal-backdrop ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`modal-content ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <FaGoogle className="modal-icon" />
            Sélectionner depuis Google Drive
          </h2>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label="Fermer"
          >
            <FaTimes />
          </button>{" "}
        </div>{" "}
        {needsSetup ? (
          <GoogleDriveSetup
            onClientIdSubmit={setPersonalClientId}
            onCancel={handleClose}
          />
        ) : !isGoogleApiLoaded ? (
          <div className="loading-state">
            <FaSpinner className="loading-spinner" />
            <p>Chargement de l'API Google Drive...</p>
          </div>
        ) : !isSignedIn ? (
          <div className="auth-section">
            <div className="google-icon">
              <FaGoogleDrive />
            </div>
            <h3>Connexion à Google Drive</h3>
            <p className="auth-description">
              {error && error.includes("expiré")
                ? "Votre session a expiré. Reconnectez-vous pour continuer."
                : "Connectez-vous à Google Drive pour accéder à vos fichiers."}
            </p>
            <button
              className="google-auth-button"
              onClick={signInToGoogle} // Changé de handleSignIn à signInToGoogle
              disabled={!isGoogleApiLoaded}
            >
              <FaGoogle className="google-icon-small" />
              {error && error.includes("expiré")
                ? "Se reconnecter"
                : "Se connecter avec Google"}
            </button>
            {!isGoogleApiLoaded && (
              <p className="loading-text">
                Chargement de l'API Google Drive...
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Barre de navigation et recherche */}
            <div className="drive-toolbar">
              <div className="navigation-controls">
                {folderHistory.length > 0 && (
                  <button
                    className="back-button"
                    onClick={handleBackClick}
                    title="Retour"
                  >
                    <FaArrowLeft />
                  </button>
                )}
                <div className="current-path">
                  {currentFolder ? currentFolder.name : "Mon Drive"}
                </div>
              </div>{" "}
              <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Rechercher des fichiers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="search-actions">
                  <button type="submit" className="search-button">
                    Rechercher
                  </button>
                  <button
                    type="button"
                    className="send-button"
                    onClick={handleUploadFiles}
                    disabled={selectedFiles.length === 0 || isUploading}
                    title={
                      selectedFiles.length === 0
                        ? "Sélectionnez des fichiers à envoyer"
                        : `Envoyer ${selectedFiles.length} fichier(s)`
                    }
                  >
                    {isUploading ? (
                      <>
                        <FaSpinner className="button-spinner" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Envoyer
                        {selectedFiles.length > 0 &&
                          ` (${selectedFiles.length})`}
                      </>
                    )}
                  </button>
                </div>
              </form>
              <button
                className="signout-button"
                onClick={signOutFromGoogle}
                title="Se déconnecter"
              >
                Déconnexion
              </button>
            </div>

            {/* Liste des fichiers */}
            <div className="drive-files-container">
              {isLoadingFiles ? (
                <div className="loading-files">
                  <FaSpinner className="loading-spinner" />
                  <p>Chargement des fichiers...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="no-files">
                  <FaFolder className="empty-icon" />
                  <p>Aucun fichier trouvé</p>
                </div>
              ) : (
                <div className="files-grid">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`file-item ${
                        file.isFolder ? "folder" : "file"
                      } ${
                        selectedFiles.some((f) => f.id === file.id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        if (file.isFolder) {
                          handleFolderClick(file);
                        } else {
                          toggleFileSelection(file);
                        }
                      }}
                    >
                      {/* Preview du fichier */}
                      <div className="file-preview">
                        {file.thumbnailLink && !file.isFolder ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            onError={(e) => {
                              e.target.parentNode.innerHTML = `<div class="file-preview-icon ${getFileIconClass(
                                file.mimeType
                              )}">${getFileIconElement(file.mimeType)}</div>`;
                            }}
                          />
                        ) : (
                          <div
                            className={`file-preview-icon ${getFileIconClass(
                              file.mimeType
                            )}`}
                          >
                            {getFileIcon(file.mimeType)}
                          </div>
                        )}
                      </div>

                      {/* Informations du fichier */}
                      <div className="file-info">
                        <div className="file-name" title={file.name}>
                          {file.name}
                        </div>
                        <div className="file-details">
                          {!file.isFolder && (
                            <>
                              <span className="file-size">
                                {file.formattedSize}
                              </span>
                              <span className="file-date">
                                {file.formattedDate}
                              </span>
                              <span className="file-type-badge">
                                {getFileTypeFromMime(file.mimeType)}
                              </span>
                            </>
                          )}
                          {file.isFolder && (
                            <span className="file-type-badge">Dossier</span>
                          )}
                        </div>
                      </div>

                      {/* Actions et sélection */}
                      <div className="file-actions">
                        <div className="selection-indicator">
                          {selectedFiles.some((f) => f.id === file.id) && (
                            <FaCheck />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions du modal */}
            <div className="modal-footer">
              <div className="selected-count">
                {selectedFiles.length > 0 && (
                  <span>
                    {selectedFiles.length} fichier
                    {selectedFiles.length > 1 ? "s" : ""} sélectionné
                    {selectedFiles.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>{" "}
              <div className="modal-actions">
                <button
                  className="cancel-button"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Annuler
                </button>
              </div>{" "}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleDriveModal;

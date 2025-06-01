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
} from "react-icons/fa";
import useGoogleDrive from "../../hooks/useGoogleDrive";
import GoogleDriveSetup from "./GoogleDriveSetup";
import "./GoogleDriveModal.css";

/**
 * Composant modal pour sélectionner des fichiers depuis Google Drive
 */
const GoogleDriveModal = ({
  show,
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
      onClose();
    },
  });

  // Charger les fichiers quand le modal s'ouvre et que l'utilisateur est connecté
  useEffect(() => {
    if (show && isSignedIn && isGoogleApiLoaded) {
      loadDriveFiles();
    }
  }, [show, isSignedIn, isGoogleApiLoaded, loadDriveFiles]);

  // Gérer la fermeture du modal
  const handleClose = () => {
    setSearchQuery("");
    setCurrentFolder(null);
    setFolderHistory([]);
    setSelectedFiles([]);
    onClose();
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
  };

  // Gérer l'upload des fichiers sélectionnés
  const handleUploadFiles = async () => {
    try {
      await uploadSelectedFiles();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload des fichiers: " + error.message);
    }
  };

  // Obtenir l'icône pour un type de fichier
  const getFileIcon = (mimeType) => {
    if (mimeType === "application/vnd.google-apps.folder") return <FaFolder />;
    if (mimeType.startsWith("image/")) return <FaImage />;
    if (mimeType.startsWith("video/")) return <FaVideo />;
    if (mimeType.startsWith("audio/")) return <FaMusic />;
    if (mimeType.includes("pdf")) return <FaFilePdf />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FaFileWord />;
    if (mimeType.includes("sheet") || mimeType.includes("excel"))
      return <FaFileExcel />;
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return <FaFilePowerpoint />;
    if (mimeType.startsWith("text/")) return <FaFileAlt />;
    return <FaFile />;
  };

  if (!show) return null;

  return (
    <div className="google-drive-modal-overlay" onClick={handleClose}>
      <div className="google-drive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="google-drive-modal-header">
          <div className="modal-title">
            <FaGoogle className="google-icon" />
            <h2>Sélectionner depuis Google Drive</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Fermer"
          >
            <FaTimes />
          </button>
        </div>{" "}
        <div className="google-drive-modal-content">
          {needsSetup ? (
            <GoogleDriveSetup
              onClientIdSubmit={setPersonalClientId}
              onCancel={handleClose}
            />
          ) : configurationError ? (
            <div className="error-state">
              <div className="error-content">
                <FaTimes className="error-icon" />
                <h3>Erreur de configuration</h3>
                <p>{configurationError}</p>
                <div className="error-help">
                  <p>
                    <strong>Pour résoudre ce problème :</strong>
                  </p>
                  <ol>
                    <li>Vérifiez que votre Client ID est correct</li>
                    <li>
                      Vérifiez que <code>http://localhost:3001</code> est dans
                      les origines autorisées
                    </li>
                    <li>Essayez de reconfigurer votre Client ID</li>
                  </ol>
                  <button
                    className="reconfigure-btn"
                    onClick={clearPersonalConfig}
                  >
                    Reconfigurer
                  </button>
                </div>
              </div>
            </div>
          ) : !isGoogleApiLoaded ? (
            <div className="loading-state">
              <FaSpinner className="loading-spinner" />
              <p>Chargement de l'API Google Drive...</p>
            </div>
          ) : !isSignedIn ? (
            <div className="auth-state">
              <div className="auth-content">
                <FaGoogle className="auth-icon" />
                <h3>Connexion à Google Drive</h3>
                <p>
                  Pour accéder à vos fichiers Google Drive, vous devez vous
                  connecter avec votre compte Google.
                </p>
                <button
                  className="auth-button"
                  onClick={signInToGoogle}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <>
                      <FaSpinner className="button-spinner" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <FaGoogle />
                      Se connecter à Google Drive
                    </>
                  )}
                </button>
              </div>
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
                </div>

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
                  <button type="submit" className="search-button">
                    Rechercher
                  </button>
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
                        <div className="file-icon">
                          {getFileIcon(file.mimeType)}
                          {selectedFiles.some((f) => f.id === file.id) && (
                            <div className="selection-indicator">
                              <FaCheck />
                            </div>
                          )}
                        </div>

                        {file.thumbnailLink && !file.isFolder ? (
                          <div className="file-thumbnail">
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        ) : null}

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
                              </>
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
                </div>

                <div className="modal-actions">
                  <button
                    className="cancel-button"
                    onClick={handleClose}
                    disabled={isUploading}
                  >
                    Annuler
                  </button>

                  <button
                    className="upload-button"
                    onClick={handleUploadFiles}
                    disabled={selectedFiles.length === 0 || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <FaSpinner className="button-spinner" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <FaCloudDownloadAlt />
                        Ajouter{" "}
                        {selectedFiles.length > 0
                          ? `(${selectedFiles.length})`
                          : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveModal;

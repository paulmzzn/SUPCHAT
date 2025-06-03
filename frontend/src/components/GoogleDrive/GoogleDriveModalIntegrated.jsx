import React, { useState, useEffect } from "react";
import {
  FaGoogle,
  FaTimes,
  FaFolder,
  FaFile,
  FaDownload,
  FaSearch,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCog,
  FaUser,
} from "react-icons/fa";
import useGoogleDriveIntegration from "../../hooks/useGoogleDriveIntegration";
import GoogleDriveSetup from "./GoogleDriveSetup";
import "./GoogleDriveModal.css";

/**
 * Modal Google Drive amélioré utilisant la colonne google_id existante
 */
const GoogleDriveModalIntegrated = ({
  isOpen,
  onClose,
  mode = "dm",
  recipientId,
  canalId,
  workspaceId,
  socket,
  onFileUpload,
  currentUser = null, // Informations utilisateur avec google_id
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  // Utiliser le hook d'intégration avec les infos utilisateur
  const {
    isLoading,
    isAuthenticated,
    files,
    selectedFiles,
    error,
    authMode,
    needsConfiguration,
    isUploading,
    userGoogleId,
    authConfig,
    signIn,
    signOut,
    loadFiles,
    toggleFileSelection,
    uploadSelectedFiles,
    navigateToFolder,
    searchFiles,
    setPersonalClientId,
    clearPersonalConfig,
  } = useGoogleDriveIntegration({
    userGoogleId: currentUser?.google_id,
    userId: currentUser?.id_utilisateur,
    mode,
    recipientId,
    canalId,
    workspaceId,
    socket,
    onFileUpload,
  });

  // Charger les fichiers quand on se connecte
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadFiles();
    }
  }, [isAuthenticated, isOpen, loadFiles]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchFiles(searchQuery);
      setCurrentFolder(null);
    } else {
      loadFiles();
    }
  };

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    navigateToFolder(folder.id);
    setSearchQuery("");
  };

  const handleBackClick = () => {
    setCurrentFolder(null);
    loadFiles();
  };

  const handleUpload = async () => {
    try {
      await uploadSelectedFiles();
      onClose();
    } catch (error) {
      console.error("Erreur upload:", error);
    }
  };

  const handleSetupComplete = (clientId) => {
    setPersonalClientId(clientId);
    setShowSetup(false);
  };

  if (!isOpen) return null;

  // Afficher la configuration si nécessaire
  if (needsConfiguration || showSetup) {
    return (
      <div className="google-drive-modal-overlay">
        <div className="google-drive-modal">
          <div className="modal-header">
            <h3>
              <FaCog />
              Configuration Google Drive
            </h3>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <GoogleDriveSetup
            onClientIdSubmit={handleSetupComplete}
            onCancel={() => setShowSetup(false)}
            authConfig={authConfig}
            currentUser={currentUser}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="google-drive-modal-overlay">
      <div className="google-drive-modal">
        {/* Header */}
        <div className="modal-header">
          <h3>
            <FaGoogle />
            Google Drive
          </h3>
          <div className="header-actions">
            {isAuthenticated && (
              <button
                className="setup-btn"
                onClick={() => setShowSetup(true)}
                title="Configuration"
              >
                <FaCog />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Informations utilisateur */}
        {currentUser && (
          <div className="user-info">
            <div className="user-details">
              <FaUser />
              <span>{currentUser.nom}</span>
              {currentUser.google_id && (
                <span className="google-connected">
                  <FaGoogle />
                  Compte Google connecté
                </span>
              )}
            </div>
            <div className="auth-mode">Mode: {authConfig.description}</div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="modal-content">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle />
              {error}
            </div>
          )}

          {!isAuthenticated ? (
            <div className="auth-section">
              <div className="auth-info">
                <FaGoogle className="large-icon" />
                <h4>Connecter Google Drive</h4>
                <p>
                  {currentUser?.google_id
                    ? "Connectez-vous avec votre compte Google existant pour accéder à vos fichiers Drive."
                    : "Connectez votre compte Google pour accéder à vos fichiers Drive."}
                </p>
                {authConfig.mode === "existing_google_account" && (
                  <div className="existing-account-info">
                    <FaCheckCircle />
                    <span>
                      Votre compte Google est déjà configuré dans SUPCHAT
                    </span>
                  </div>
                )}
              </div>
              <button
                className="connect-btn"
                onClick={signIn}
                disabled={isLoading}
              >
                <FaGoogle />
                {isLoading ? "Connexion..." : "Se connecter à Google Drive"}
              </button>
            </div>
          ) : (
            <>
              {" "}
              {/* Barre de recherche et navigation */}
              <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher des fichiers..."
                    className="search-input"
                  />
                  <div className="search-actions">
                    <button type="submit" className="search-btn">
                      <FaSearch />
                      Rechercher
                    </button>
                    <button
                      type="button"
                      className="send-button"
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || isUploading}
                      title={
                        selectedFiles.length === 0
                          ? "Sélectionnez des fichiers à envoyer"
                          : `Envoyer ${selectedFiles.length} fichier(s)`
                      }
                    >
                      {isUploading ? (
                        <>
                          <FaDownload className="button-spinner" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <FaDownload />
                          Envoyer
                          {selectedFiles.length > 0 &&
                            ` (${selectedFiles.length})`}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {currentFolder && (
                  <div className="breadcrumb">
                    <button onClick={handleBackClick} className="back-btn">
                      <FaArrowLeft />
                      Retour
                    </button>
                    <span className="current-folder">
                      <FaFolder />
                      {currentFolder.name}
                    </span>
                  </div>
                )}
              </div>
              {/* Liste des fichiers */}
              <div className="files-section">
                {isLoading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <span>Chargement des fichiers...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="no-files">
                    <FaFile />
                    <span>Aucun fichier trouvé</span>
                  </div>
                ) : (
                  <div className="files-list">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`file-item ${
                          selectedFiles.some((f) => f.id === file.id)
                            ? "selected"
                            : ""
                        } ${file.isFolder ? "folder" : "file"}`}
                        onClick={() =>
                          file.isFolder
                            ? handleFolderClick(file)
                            : toggleFileSelection(file)
                        }
                      >
                        <div className="file-icon">
                          {file.isFolder ? <FaFolder /> : <FaFile />}
                        </div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-meta">
                            {!file.isFolder && (
                              <>
                                <span>{file.formattedSize}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{file.formattedDate}</span>
                          </div>
                        </div>
                        {selectedFiles.some((f) => f.id === file.id) && (
                          <div className="selected-indicator">
                            <FaCheckCircle />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>{" "}
              {/* Actions */}
              <div className="actions-section">
                <div className="selection-info">
                  {selectedFiles.length > 0 && (
                    <span>
                      {selectedFiles.length} fichier(s) sélectionné(s)
                    </span>
                  )}
                </div>
                <div className="action-buttons">
                  <button onClick={signOut} className="secondary-btn">
                    Se déconnecter
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

export default GoogleDriveModalIntegrated;

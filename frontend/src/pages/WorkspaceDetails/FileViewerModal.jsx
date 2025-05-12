import React, { useState, useEffect } from "react";
import { FaDownload, FaTimes, FaTable, FaCode } from "react-icons/fa";
import DataTableViewer from "../../components/DataTableViewer/DataTableViewer";
import "./FileViewerModal.css";

function FileViewerModal({
  fullscreenFile,
  handleCloseFileViewer,
  handleDownloadFile,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [viewMode, setViewMode] = useState("auto"); // "auto", "raw", "table"
  const [authToken, setAuthToken] = useState(null);

  // Récupérer le token d'authentification depuis localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthToken(token);
  }, []);

  // Détecte si le fichier est un type tabulaire (CSV, TSV, etc.)
  const isTabularFile = () => {
    if (!fullscreenFile) return false;

    const fileName = fullscreenFile.fileName || fullscreenFile.name || "";
    const fileType = fullscreenFile.fileType || "";
    const fileExt = fileName.split(".").pop().toLowerCase();

    // Détecter par l'extension
    const tabularExtensions = ["csv", "tsv", "xls", "xlsx", "json"];
    if (tabularExtensions.includes(fileExt)) return true;

    // Détecter par le type MIME
    if (
      fileType.includes("csv") ||
      fileType.includes("excel") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("json")
    )
      return true;

    return false;
  };

  // Reset loading state when a new file is displayed
  useEffect(() => {
    if (fullscreenFile) {
      setIsLoading(true);
      setIsError(false);

      // Déterminer le mode d'affichage initial
      if (isTabularFile()) {
        setViewMode("table");
      } else if (fullscreenFile.isImage) {
        setViewMode("auto");
      } else {
        setViewMode("auto");
      }
    }
  }, [fullscreenFile]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  // Fermeture du modal avec la touche Échap
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleCloseFileViewer();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [handleCloseFileViewer]);

  if (!fullscreenFile) return null;

  // Déterminer l'URL du fichier
  const fileUrl = fullscreenFile.fullFileUrl || fullscreenFile.fileUrl;
  const fileName = fullscreenFile.fileName || fullscreenFile.name;

  return (
    <>
      <div
        className="fullscreen-modal-overlay"
        onClick={handleCloseFileViewer}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="fullscreen-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="fullscreen-modal-header">
            <h3 className="fullscreen-modal-title">{fileName}</h3>

            {/* Ajout des boutons de changement de vue pour les fichiers tabulaires */}
            {isTabularFile() && (
              <div className="fullscreen-view-modes">
                <button
                  className={`view-mode-button ${
                    viewMode === "table" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("table")}
                  title="Vue tableau"
                >
                  <FaTable /> Tableau
                </button>
                <button
                  className={`view-mode-button ${
                    viewMode === "raw" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("raw")}
                  title="Vue brute"
                >
                  <FaCode /> Code brut
                </button>
              </div>
            )}

            <button
              className="fullscreen-modal-close"
              onClick={handleCloseFileViewer}
              aria-label="Fermer"
            >
              <FaTimes />
            </button>
          </div>

          <div className="fullscreen-modal-body">
            {isLoading && (
              <div className="image-loading">
                <div className="spinner"></div>
              </div>
            )}

            {/* Affichage spécifique selon le type de fichier et le mode de vue */}
            {isTabularFile() && viewMode === "table" ? (
              <div className="fullscreen-table-view">
                <DataTableViewer
                  fileUrl={fileUrl}
                  fileName={fileName}
                  authToken={authToken}
                />
              </div>
            ) : fullscreenFile.isImage ? (
              <img
                src={fileUrl}
                alt={fileName}
                className="fullscreen-image"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div className="fullscreen-file">
                <iframe
                  src={fileUrl}
                  title={fileName}
                  className="file-preview-frame"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                ></iframe>
              </div>
            )}
          </div>

          <div className="fullscreen-modal-footer">
            <span className="file-info-display">
              {isTabularFile() &&
                viewMode === "table" &&
                "Cliquez sur les en-têtes pour trier les données"}
            </span>
            <button
              className="fullscreen-download-btn"
              onClick={() => handleDownloadFile(fileUrl, fileName)}
            >
              <FaDownload /> Télécharger
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FileViewerModal;

// Composant pour sélectionner la source de fichiers (local ou Google Drive)
import React from "react";
import { FaFolder, FaTimes, FaGoogleDrive } from "react-icons/fa";
import "./FileSourceSelector.css";

/**
 * Popup de sélection de source de fichiers
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.isOpen - État d'ouverture du popup
 * @param {function} props.onClose - Fonction de fermeture
 * @param {function} props.onSelectLocal - Fonction appelée pour sélection locale
 * @param {function} props.onSelectGoogleDrive - Fonction appelée pour Google Drive
 * @returns {JSX.Element}
 */
const FileSourceSelector = ({
  isOpen,
  onClose,
  onSelectLocal,
  onSelectGoogleDrive,
}) => {
  // Pas de rendu si non visible
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div
      className="file-source-overlay"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="file-source-popup">
        <div className="file-source-header">
          <h3>Choisir la source des fichiers</h3>
          <button className="file-source-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="file-source-content">
          <p>Sélectionnez d'où vous voulez importer vos fichiers :</p>

          <div className="file-source-options">
            {/* Option fichiers locaux */}
            <button
              className="file-source-option local-option"
              onClick={onSelectLocal}
            >
              <div className="option-icon">
                <FaFolder />
              </div>
              <div className="option-text">
                <h4>Fichiers locaux</h4>
                <p>Parcourir les fichiers de votre appareil</p>
              </div>
            </button>

            {/* Option Google Drive */}
            <button
              className="file-source-option drive-option"
              onClick={onSelectGoogleDrive}
            >
              <div className="option-icon">
                <FaGoogleDrive />
              </div>
              <div className="option-text">
                <h4>Google Drive</h4>
                <p>Choisir des fichiers depuis votre Google Drive</p>
              </div>
            </button>
          </div>
        </div>

        <div className="file-source-footer">
          <button className="cancel-button" onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSourceSelector;

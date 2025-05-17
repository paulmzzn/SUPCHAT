import React from "react";
import { FaTimes, FaExternalLinkAlt, FaPoll, FaChartBar } from "react-icons/fa";
import "./StrawpollWebviewModal.css";

function StrawpollWebviewModal({ show, pollId, onClose }) {
  if (!show || !pollId) return null;

  // Format correct pour les URL Strawpoll
  const pollUrl = `https://strawpoll.com/polls/${pollId}`;

  const openInNewTab = () => {
    window.open(pollUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="webview-modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="webview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="webview-modal-header">
          <h2>
            <FaPoll style={{ marginRight: "8px" }} /> Sondage Strawpoll
          </h2>
          <button
            className="webview-close-button"
            onClick={onClose}
            aria-label="Fermer"
          >
            <FaTimes />
          </button>
        </div>

        <div className="webview-modal-content">
          <div className="webview-external-content">
            <div className="strawpoll-redirect-message">
              <FaChartBar className="strawpoll-icon" />
              <h3>Accéder au sondage</h3>
              <p>
                Pour des raisons de sécurité, ce sondage doit être ouvert dans
                un nouvel onglet. Cliquez sur le bouton ci-dessous pour
                participer.
              </p>
              <button className="open-external-button" onClick={openInNewTab}>
                <FaExternalLinkAlt /> Ouvrir le sondage
              </button>
              <p className="strawpoll-note">
                Une fois votre vote effectué, vous pourrez voir les résultats
                directement sur le site de Strawpoll.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StrawpollWebviewModal;

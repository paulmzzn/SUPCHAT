import React from "react";
import { FaGlobe, FaLock } from "react-icons/fa";

function CreateChannelModal({
  channelError,
  newChannel,
  isCreatingChannel,
  handleCloseModal,
  handleSubmitChannel,
  handleChannelInputChange,
  setNewChannel,
}) {
  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Nouveau canal</h2>
        {channelError && (
          <p className="error-message">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "8px" }}>
              <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="#ff6b6b" strokeWidth="1.5" />
              <path d="M8 5v3" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.5" fill="#ff6b6b" />
            </svg>
            {channelError}
          </p>
        )}
        <form onSubmit={handleSubmitChannel}>
          <div className="form-group">
            <label htmlFor="name">Nom du canal</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newChannel.name}
              onChange={handleChannelInputChange}
              placeholder="ex: general, marketing, dev..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Visibilité du canal</label>
            <div className="channel-visibility-selector">
              <button
                type="button"
                className={`visibility-option ${!newChannel.isPrivate ? "selected" : ""}`}
                onClick={() => setNewChannel((prev) => ({ ...prev, isPrivate: false }))}
              >
                <FaGlobe className="visibility-icon" />
                <div className="visibility-info">
                  <span className="visibility-title">Public</span>
                  <span className="visibility-desc">Accessible à tous les membres</span>
                </div>
              </button>
              <button
                type="button"
                className={`visibility-option ${newChannel.isPrivate ? "selected" : ""}`}
                onClick={() => setNewChannel((prev) => ({ ...prev, isPrivate: true }))}
              >
                <FaLock className="visibility-icon" />
                <div className="visibility-info">
                  <span className="visibility-title">Privé</span>
                  <span className="visibility-desc">Accessible sur invitation</span>
                </div>
              </button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={handleCloseModal} className="cancel-btn">Annuler</button>
            <button type="submit" className="create-btn" disabled={isCreatingChannel}>
              {isCreatingChannel ? "Création..." : "Créer le canal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChannelModal;

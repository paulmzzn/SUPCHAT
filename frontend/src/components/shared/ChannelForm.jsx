import React from "react";
import { FaGlobe, FaLock } from "react-icons/fa";

function ChannelForm({
  channel,
  onChannelChange,
  errorMessage,
  isSubmitting,
  onSubmit,
  onCancel,
  submitButtonText = "Créer le canal",
  submittingText = "Création..."
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChannelChange(prev => ({ ...prev, [name]: value }));
  };

  const handleVisibilityChange = (isPrivate) => {
    onChannelChange(prev => ({ ...prev, isPrivate }));
  };

  return (
    <form onSubmit={onSubmit}>
      {errorMessage && (
        <p className="error-message">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "8px" }}>
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="#ff6b6b" strokeWidth="1.5" />
            <path d="M8 5v3" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.5" fill="#ff6b6b" />
          </svg>
          {errorMessage}
        </p>
      )}
      
      <div className="form-group">
        <label htmlFor="channel-name">Nom du canal</label>
        <input
          type="text"
          id="channel-name"
          name="name"
          value={channel.name}
          onChange={handleInputChange}
          placeholder="ex: general, marketing, dev..."
          autoFocus
        />
      </div>
      
      <div className="form-group">
        <label>Visibilité du canal</label>
        <div className="channel-visibility-selector">
          <button
            type="button"
            className={`visibility-option ${!channel.isPrivate ? "selected" : ""}`}
            onClick={() => handleVisibilityChange(false)}
          >
            <FaGlobe className="visibility-icon" />
            <div className="visibility-info">
              <span className="visibility-title">Public</span>
              <span className="visibility-desc">Accessible à tous les membres</span>
            </div>
          </button>
          <button
            type="button"
            className={`visibility-option ${channel.isPrivate ? "selected" : ""}`}
            onClick={() => handleVisibilityChange(true)}
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
        <button type="button" onClick={onCancel} className="cancel-btn">
          Annuler
        </button>
        <button type="submit" className="create-btn" disabled={isSubmitting}>
          {isSubmitting ? submittingText : submitButtonText}
        </button>
      </div>
    </form>
  );
}

export default ChannelForm;
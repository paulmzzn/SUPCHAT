import React, { useState } from "react";
import { FaPoll, FaPlus, FaTimes, FaCheck } from "react-icons/fa";

const StrawpollModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (idx, value) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? value : opt)));
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Le titre du sondage est requis.");
      return;
    }
    const filteredOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      setError("Au moins 2 options sont requises.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), options: filteredOptions });
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de la création du sondage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="strawpoll-modal">
      <h2>
        <FaPoll /> Créer un sondage Strawpoll
      </h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="poll-title">Titre du sondage</label>
          <input
            id="poll-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Quel est votre framework préféré ?"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Options</label>
          {options.map((opt, idx) => (
            <div className="option-item" key={idx}>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  aria-label="Supprimer l'option"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddOption}>
            <FaPlus /> Ajouter une option
          </button>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button type="submit" className="create-btn" disabled={loading}>
            {loading ? (
              "Création en cours..."
            ) : (
              <>
                <FaCheck /> Créer le sondage
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StrawpollModal;

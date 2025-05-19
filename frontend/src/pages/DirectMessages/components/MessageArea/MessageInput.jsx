// Composant pour la saisie de messages
import React from "react";
import { FaPaperPlane, FaPaperclip, FaTimes } from "react-icons/fa";
import MentionSuggestions from "./MentionSuggestions";

/**
 * Composant pour la saisie et l'envoi de messages
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const MessageInput = ({
  newMessage,
  setNewMessage,
  replyingTo,
  onCancelReply,
  attachments,
  removeAttachment,
  uploadingFile,
  fileInputRef,
  onAttachmentClick,
  onSubmit,
  handleInputChange,
  usersInfo,
  showMentionSuggestions,
  mentionSuggestions,
  activeMentionIndex,
  onMentionSelect,
}) => {
  return (
    <form className="dm-input-form" onSubmit={onSubmit}>
      {/* Zone de réponse */}
      {replyingTo && (
        <div className="dm-replying-to">
          <div className="dm-replying-info">
            <span>Réponse à </span>
            <strong>
              {usersInfo[replyingTo.fk_expediteur]?.name || "Utilisateur"}
            </strong>
            <span className="dm-replying-content">: {replyingTo.contenu}</span>
          </div>
          <button
            type="button"
            className="dm-cancel-reply"
            onClick={onCancelReply}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Aperçu des pièces jointes */}
      {attachments.length > 0 && (
        <div className="dm-attachments-preview">
          {attachments.map((att, index) => (
            <div
              key={att.id_fichier || index}
              className="dm-attachment-preview"
            >
              <span className="attachment-name">{att.nom_fichier}</span>
              <button
                type="button"
                className="attachment-remove"
                onClick={() => removeAttachment(index)}
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="dm-input-wrapper">
        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) =>
            e.target.files && e.target.files.length > 0
              ? handleInputChange(e)
              : null
          }
          style={{ display: "none" }}
        />

        {/* Bouton d'attachement */}
        <button
          type="button"
          className={`dm-attachment-btn ${uploadingFile ? "uploading" : ""}`}
          onClick={onAttachmentClick}
          disabled={uploadingFile}
        >
          <FaPaperclip />
          {uploadingFile && <span className="upload-spinner"></span>}
        </button>

        {/* Champ de saisie */}
        <input
          type="text"
          placeholder="Saisissez votre message..."
          value={newMessage}
          onChange={handleInputChange}
          className="dm-input"
          disabled={uploadingFile}
        />

        {/* Bouton d'envoi */}
        <button
          type="submit"
          className="dm-send-btn"
          disabled={
            (!newMessage.trim() && attachments.length === 0) || uploadingFile
          }
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* Suggestions de mentions */}
      {showMentionSuggestions && mentionSuggestions.length > 0 && (
        <MentionSuggestions
          suggestions={mentionSuggestions}
          activeIndex={activeMentionIndex}
          onSelect={onMentionSelect}
        />
      )}
    </form>
  );
};

export default MessageInput;

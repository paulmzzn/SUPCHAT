// Composant pour la saisie de messages
import React, { useEffect } from "react";
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
  handleFileSelect,
  onAttachmentClick,
  onSubmit,
  handleInputChange,
  usersInfo,
  showMentionSuggestions,
  mentionSuggestions,
  activeMentionIndex,
  onMentionSelect,
}) => {
  // Dans un useEffect de MessageInput
  useEffect(() => {
    const handleForceReply = () => {
      try {
        const replyData = localStorage.getItem("dm_reply_to");
        if (replyData) {
          const message = JSON.parse(replyData);
          // Simuler l'affichage de la réponse localement
          setLocalReplyingTo(message);
          localStorage.removeItem("dm_reply_to");
        }
      } catch (e) {
        console.error("Erreur lors du forçage de la réponse:", e);
      }
    };

    window.addEventListener("dm_force_reply", handleForceReply);
    return () => window.removeEventListener("dm_force_reply", handleForceReply);
  }, []);

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
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect}
          multiple
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

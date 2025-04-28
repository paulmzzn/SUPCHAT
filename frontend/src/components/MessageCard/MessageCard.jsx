import React from "react";
import "./MessageCard.css";
import { FaReply, FaRegSmile, FaTrashAlt, FaRobot } from "react-icons/fa";

const MessageCard = ({
  message,
  isOwn,
  onReply,
  onReact,
  onDelete,
  onClick,
  onContextMenu,
  children,
}) => {
  return (
    <div
      className={`message-card${isOwn ? " own" : ""}`}
      id={`msg-${message.id_message}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="message-card-avatar">
        {message.photo_de_profil ? (
          <img src={message.photo_de_profil} alt={message.nom} />
        ) : (
          <div className="avatar-placeholder">
            {message.nom ? message.nom[0].toUpperCase() : "?"}
          </div>
        )}
      </div>
      <div className="message-card-content">
        {/* Affichage du message parent si réponse */}
        {(message.parent_id || message.parent_message) && (
          <div className="message-card-reply">
            <FaReply className="reply-icon" />
            <span className="reply-author">
              @{message.parent_message?.nom || message.parent_nom || "?"}
            </span>
            <span className="reply-text">
              {message.parent_message?.contenu || message.parent_contenu || ""}
            </span>
          </div>
        )}
        <div className="message-card-header">
          <span className="message-card-author">
            {message.fk_utilisateur === "00000000-0000-0000-0000-000000000001" ? (
              <>
                <span>{message.nom}</span>
                <span className="bot-icon-spacer"> </span>
                <FaRobot className="bot-icon" />
              </>
            ) : (
              message.nom
            )}
          </span>
          <span className="message-card-time">{message.date_creation}</span>
        </div>
        <div className="message-card-text">{children}</div>
        {/* Actions */}
        <div className="message-card-actions">
          <button className="action-btn" onClick={onReply} title="Répondre">
            <FaReply />
          </button>
          <button className="action-btn" onClick={onReact} title="Réagir">
            <FaRegSmile />
          </button>
          {isOwn && (
            <button className="action-btn" onClick={onDelete} title="Supprimer">
              <FaTrashAlt />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

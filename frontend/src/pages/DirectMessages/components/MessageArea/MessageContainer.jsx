// Composant pour afficher les messages
import React from "react";
import MessageItem from "./MessageItem";

/**
 * Conteneur pour afficher la liste des messages
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const MessageContainer = ({
  messages,
  loadingMessages,
  currentUserId,
  selectedUserInfo,
  usersInfo,
  messagesContainerRef,
  onMessageContextMenu,
  renderTextWithMentions,
  formatMessageDate,
  getFileIcon,
  getCompleteFileUrl,
  formatFileSize,
  onDownloadFile,
}) => {
  return (
    <div className="dm-messages" ref={messagesContainerRef}>
      {loadingMessages ? (
        <div className="dm-loading">Chargement des messages...</div>
      ) : messages.length === 0 ? (
        <div className="dm-empty-msg">
          <p>Aucun message</p>
          <p>Envoyez le premier message !</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isOwn = msg.fk_expediteur === currentUserId;

          if (msg.is_deleted) {
            return (
              <div
                key={msg.id_message_prive}
                className={`dm-message ${isOwn ? "own" : "other"} deleted`}
              >
                <div className="dm-msg-content">
                  <div className="dm-msg-bubble deleted">
                    <em>Ce message a été supprimé</em>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <MessageItem
              key={msg.id_message_prive}
              message={msg}
              isOwn={isOwn}
              usersInfo={usersInfo}
              currentUserId={currentUserId}
              messages={messages}
              renderTextWithMentions={renderTextWithMentions}
              formatMessageDate={formatMessageDate}
              getFileIcon={getFileIcon}
              getCompleteFileUrl={getCompleteFileUrl}
              formatFileSize={formatFileSize}
              onMessageContextMenu={onMessageContextMenu}
              onDownloadFile={onDownloadFile}
            />
          );
        })
      )}
    </div>
  );
};

export default MessageContainer;

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
  onImageClick,
  onReplyMessage, // Ajout explicite de la prop pour le bouton "Répondre"
  onRemoveReaction,
}) => {
  const lastMessageIdRef = React.useRef();
  const prevMessagesLengthRef = React.useRef(0);

  // Scroll automatique uniquement si un nouveau message est ajouté
  React.useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const lastMsgId = lastMsg ? lastMsg.id_message_prive : undefined;
    const prevLastMsgId = lastMessageIdRef.current;
    const prevLength = prevMessagesLengthRef.current;

    // Nouveau message si la longueur augmente OU l'ID du dernier message change
    const isNewMessage =
      messages.length > prevLength ||
      (lastMsgId && lastMsgId !== prevLastMsgId);

    if (isNewMessage && messagesContainerRef && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }

    // Mettre à jour les refs pour la prochaine exécution
    lastMessageIdRef.current = lastMsgId;
    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentUserId]);

  // Scroll automatique vers le bas quand on change de conversation (selectedUser)
  React.useEffect(() => {
    if (messagesContainerRef && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [selectedUserInfo]);

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
              onImageClick={onImageClick}
              onReply={onReplyMessage} // Passe le handler pour le bouton "Répondre" (clic droit ou bouton)
              onRemoveReaction={onRemoveReaction}
            />
          );
        })
      )}
    </div>
  );
};

export default MessageContainer;

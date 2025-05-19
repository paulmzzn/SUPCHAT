// Composant principal pour la zone des messages
import React from "react";
import { FaUserCircle } from "react-icons/fa";
import MessageContainer from "./MessageContainer";
import MessageInput from "./MessageInput";
import MessageContextMenu from "./MessageContextMenu";
import EmojiPicker from "./EmojiPicker";
import MessageEditor from "./MessageEditor";

/**
 * Zone principale d'affichage et interaction avec les messages
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const MessageArea = ({
  selectedUser,
  selectedUserInfo,
  messages,
  loadingMessages,
  currentUserId,
  usersInfo,
  newMessage,
  setNewMessage,
  replyingTo,
  editingMessage,
  editMessageContent,
  setEditMessageContent,
  attachments,
  uploadingFile,
  messageContextMenu,
  showEmojiPicker,
  emojiPickerPosition,
  messagesContainerRef,
  fileInputRef,
  emojiPickerRef,
  handleFileSelect,
  handleAttachmentClick,
  handleSendMessage,
  handleInputChange,
  handleCancelReply,
  handleSaveEdit,
  handleCancelEdit,
  removeAttachment,
  onMessageContextMenu,
  onCloseMessageContextMenu,
  onReplyMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onEmojiSelect,
  onDownloadFile,
  showMentionSuggestions,
  mentionSuggestions,
  activeMentionIndex,
  onMentionSelect,
  renderTextWithMentions,
  formatMessageDate,
  getFileIcon,
  getCompleteFileUrl,
  formatFileSize,
}) => {
  if (!selectedUser) {
    return (
      <div className="dm-main">
        <div className="glow-circle-right top-right"></div>
        <div className="glow-circle-left bottom-left"></div>
        <div className="dm-empty-msg">
          <h2>Sélectionnez une conversation</h2>
          <p>Choisissez un contact pour afficher vos messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-main">
      {/* Éléments SVG pour l'arrière-plan */}
      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>

      {/* Header avec infos du contact */}
      <div className="dm-header">
        <div className="dm-header-info">
          {selectedUserInfo?.avatar ? (
            <img
              src={selectedUserInfo.avatar}
              alt={selectedUserInfo.name || "User"}
              className="dm-header-avatar"
            />
          ) : (
            <FaUserCircle className="dm-header-avatar" />
          )}
          <h2 className="dm-header-username">
            {selectedUserInfo?.name || "Utilisateur"}
          </h2>
          <div className="dm-header-status">
            <span
              className={`status-dot ${
                selectedUserInfo?.status === "online" ? "online" : "offline"
              }`}
            ></span>
            <span>
              {selectedUserInfo?.status === "online"
                ? "En ligne"
                : "Hors ligne"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageContainer
        messages={messages}
        loadingMessages={loadingMessages}
        currentUserId={currentUserId}
        selectedUserInfo={selectedUserInfo}
        usersInfo={usersInfo}
        messagesContainerRef={messagesContainerRef}
        onMessageContextMenu={onMessageContextMenu}
        renderTextWithMentions={renderTextWithMentions}
        formatMessageDate={formatMessageDate}
        getFileIcon={getFileIcon}
        getCompleteFileUrl={getCompleteFileUrl}
        formatFileSize={formatFileSize}
        onDownloadFile={onDownloadFile}
      />

      {/* Éditeur de message (si un message est en cours d'édition) */}
      {editingMessage && (
        <MessageEditor
          content={editMessageContent}
          setContent={setEditMessageContent}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Input de nouveau message (si aucun message n'est en cours d'édition) */}
      {!editingMessage && (
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          attachments={attachments}
          removeAttachment={removeAttachment}
          uploadingFile={uploadingFile}
          fileInputRef={fileInputRef}
          onAttachmentClick={handleAttachmentClick}
          onSubmit={handleSendMessage}
          handleInputChange={handleInputChange}
          usersInfo={usersInfo}
          showMentionSuggestions={showMentionSuggestions}
          mentionSuggestions={mentionSuggestions}
          activeMentionIndex={activeMentionIndex}
          onMentionSelect={onMentionSelect}
        />
      )}

      {/* Menu contextuel pour les messages */}
      <MessageContextMenu
        visible={messageContextMenu.visible}
        xPos={messageContextMenu.xPos}
        yPos={messageContextMenu.yPos}
        isOwnMessage={messageContextMenu.isOwnMessage}
        onReply={onReplyMessage}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
        onAddReaction={onAddReaction}
        onClose={onCloseMessageContextMenu}
      />

      {/* Sélecteur d'emoji */}
      <EmojiPicker
        show={showEmojiPicker}
        position={emojiPickerPosition}
        onSelect={onEmojiSelect}
        pickerRef={emojiPickerRef}
      />
    </div>
  );
};

export default MessageArea;

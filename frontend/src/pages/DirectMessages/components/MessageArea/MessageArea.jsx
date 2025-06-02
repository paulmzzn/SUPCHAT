// Composant principal pour la zone des messages
import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import MessageContainer from "./MessageContainer";
import MessageInput from "./MessageInput";
import MessageContextMenu from "./MessageContextMenu";
import EmojiPicker from "./EmojiPicker";
import MessageEditor from "./MessageEditor";
import FileViewerModal from "../../../WorkspaceDetails/FileViewerModal.jsx";

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
  const [fullscreenFile, setFullscreenFile] = useState(null);
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

  // Fallback si messages est undefined (ne devrait pas arriver)
  const safeMessages = Array.isArray(messages) ? messages : [];

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
      </div>{" "}
      {/* Messages */}
      <MessageContainer
        messages={safeMessages}
        loadingMessages={loadingMessages || false}
        currentUserId={currentUserId || ""}
        selectedUserInfo={selectedUserInfo || {}}
        usersInfo={usersInfo || {}}
        messagesContainerRef={messagesContainerRef}
        onMessageContextMenu={onMessageContextMenu || (() => {})}
        renderTextWithMentions={renderTextWithMentions || ((text) => text)}
        formatMessageDate={formatMessageDate || ((date) => date)}
        getFileIcon={getFileIcon || (() => null)}
        getCompleteFileUrl={getCompleteFileUrl || ((url) => url)}
        formatFileSize={formatFileSize || ((size) => size)}
        onDownloadFile={onDownloadFile || (() => {})}
        onImageClick={(file) => setFullscreenFile(file)}
        onReplyMessage={onReplyMessage || (() => {})}
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
      {/* Input de nouveau message (si aucun message n'est en cours d'édition) */}{" "}
      {!editingMessage && (
        <MessageInput
          newMessage={newMessage || ""}
          setNewMessage={setNewMessage || (() => {})}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply || (() => {})}
          attachments={attachments || []}
          removeAttachment={removeAttachment || (() => {})}
          uploadingFile={uploadingFile || false}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect || (() => {})}
          onAttachmentClick={handleAttachmentClick || (() => {})}
          onSubmit={handleSendMessage || (() => {})}
          handleInputChange={handleInputChange || (() => {})}
          usersInfo={usersInfo || {}}
          showMentionSuggestions={showMentionSuggestions || false}
          mentionSuggestions={mentionSuggestions || []}
          activeMentionIndex={activeMentionIndex || 0}
          onMentionSelect={onMentionSelect || (() => {})}
        />
      )}{" "}
      {/* Menu contextuel pour les messages */}
      <MessageContextMenu
        visible={messageContextMenu?.visible || false}
        xPos={messageContextMenu?.xPos || 0}
        yPos={messageContextMenu?.yPos || 0}
        isOwnMessage={messageContextMenu?.isOwnMessage || false}
        message={messageContextMenu?.message || null}
        onReply={() => {
          if (messageContextMenu?.message) {
            onReplyMessage(messageContextMenu.message);
            onCloseMessageContextMenu();
          }
        }}
        onEdit={onEditMessage || (() => {})}
        onDelete={onDeleteMessage || (() => {})}
        onAddReaction={onAddReaction || (() => {})}
        onClose={onCloseMessageContextMenu || (() => {})}
      />
      {/* Sélecteur d'emoji */}
      <EmojiPicker
        show={showEmojiPicker || false}
        position={emojiPickerPosition || { top: 0, left: 0 }}
        onSelect={onEmojiSelect || (() => {})}
        pickerRef={emojiPickerRef}
      />
      <FileViewerModal
        fullscreenFile={fullscreenFile}
        handleCloseFileViewer={() => setFullscreenFile(null)}
        handleDownloadFile={onDownloadFile}
      />
    </div>
  );
};

export default MessageArea;

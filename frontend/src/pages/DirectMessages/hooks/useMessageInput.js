// Hook pour la gestion de la saisie, envoi, édition, reply, pièces jointes
import { useCallback } from "react";

export function useMessageInput({
  selectedUser,
  socket,
  currentUserId,
  attachments,
  setAttachments,
  replyingTo,
  setReplyingTo,
  setMessages,
  newMessage, // <-- passé par le parent
  setNewMessage, // <-- passé par le parent
}) {
  // Envoi de message
  const handleSendMessage = useCallback(
    (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!selectedUser || !socket || !currentUserId) return;
      if (!newMessage.trim() && (!attachments || attachments.length === 0))
        return;
      // Générer un tempId unique pour le message optimiste et le payload
      const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      socket.emit("privateMessage", {
        destinataireId: selectedUser,
        contenu: newMessage,
        replyToId: replyingTo ? replyingTo.id_message_prive : null,
        attachments: attachments ? attachments.map((a) => a.id_fichier) : [],
        tempId, // Ajout du tempId pour le backend et le frontend
      });
      setMessages((prev) => [
        ...prev,
        {
          id_message_prive: tempId, // Utiliser le tempId comme id temporaire
          tempId, // Pour le matching lors du retour WebSocket
          contenu: newMessage,
          fk_expediteur: currentUserId,
          fk_destinataire: selectedUser,
          date_creation: new Date().toISOString(),
          isOptimistic: true,
          attachments: [...(attachments || [])],
          parent_id: replyingTo ? replyingTo.id_message_prive : null,
          is_deleted: false,
          reactions: [],
        },
      ]);
      setReplyingTo(null);
      setAttachments([]);
      setNewMessage("");
    },
    [
      selectedUser,
      socket,
      currentUserId,
      newMessage,
      attachments,
      replyingTo,
      setMessages,
      setReplyingTo,
      setAttachments,
      setNewMessage,
    ]
  );

  // Gestion du champ de saisie
  const handleInputChange = useCallback(
    (e) => {
      setNewMessage(e.target.value);
    },
    [setNewMessage]
  );

  return {
    handleSendMessage,
    handleInputChange,
  };
}

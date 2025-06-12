// Hook pour la gestion de la saisie, envoi, édition, reply, pièces jointes
import { useCallback, useState, useEffect } from "react";

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
  isSocketConnected = false, // <-- nouvel état
  hasJoinedPrivateRoom = false, // <-- nouvel état
  ensurePrivateRoomJoined = () => false, // <-- nouvelle fonction
}) {
  // État pour gérer les messages en attente d'envoi
  const [pendingMessage, setPendingMessage] = useState(null);

  // Effet pour envoyer les messages en attente quand la room privée est rejointe
  useEffect(() => {
    if (hasJoinedPrivateRoom && pendingMessage) {
      console.log("[DM] Room privée rejointe, envoi du message en attente");
      const { destinataireId, contenu, replyToId, attachments: pendingAttachments, tempId } = pendingMessage;
      
      socket.emit("privateMessage", {
        destinataireId,
        contenu,
        replyToId,
        attachments: pendingAttachments,
        tempId,
      });

      setMessages((prev) => [
        ...prev,
        {
          id_message_prive: tempId,
          tempId,
          contenu,
          fk_expediteur: currentUserId,
          fk_destinataire: destinataireId,
          date_creation: new Date().toISOString(),
          isOptimistic: true,
          attachments: attachments || [],
          parent_id: replyToId,
          is_deleted: false,
          reactions: [],
        },
      ]);

      setReplyingTo(null);
      setAttachments([]);
      setNewMessage("");
      setPendingMessage(null);
    }
  }, [hasJoinedPrivateRoom, pendingMessage, socket, setMessages, currentUserId, attachments, setReplyingTo, setAttachments, setNewMessage]);

  // Envoi de message
  const handleSendMessage = useCallback(
    (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!selectedUser || !socket || !currentUserId) return;
      if (!newMessage.trim() && (!attachments || attachments.length === 0))
        return;

      // Vérifier que le socket est connecté et a rejoint la room privée
      if (!isSocketConnected) {
        console.error("[DM] Socket non connecté, impossible d'envoyer le message");
        return;
      }

      if (!hasJoinedPrivateRoom) {
        console.warn("[DM] Room privée non rejointe, mise en attente du message...");
        
        // Générer un tempId unique pour le message en attente
        const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Mettre le message en attente
        setPendingMessage({
          destinataireId: selectedUser,
          contenu: newMessage,
          replyToId: replyingTo ? replyingTo.id_message_prive : null,
          attachments: attachments ? attachments.map((a) => a.id_fichier) : [],
          tempId,
        });

        // Essayer de rejoindre la room privée
        ensurePrivateRoomJoined();
        return;
      }

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
      isSocketConnected,
      hasJoinedPrivateRoom,
      ensurePrivateRoomJoined,
      pendingMessage,
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

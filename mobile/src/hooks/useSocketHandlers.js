import { useEffect, useCallback } from 'react';

export const useSocketHandlers = (
  socket,
  workspaceId,
  channelId,
  currentUserId,
  handleNewMessage,
  handleReconnect,
  handleDisconnect,
  setMessages,
  setTypingUsers
) => {
  // Mémoriser les handlers avec useCallback pour éviter les re-renders inutiles
  const handleDeleteMessage = useCallback((data) => {
    console.log("🗑️ Message supprimé:", data);
    if (data && data.messageId) {
      setMessages(prev => prev.filter(msg => msg.id_message !== data.messageId));
    }
  }, [setMessages]);

  const handleMessage = useCallback((data) => {
    console.log("📨 [useSocketHandlers] Nouveau message reçu:", data);
    if (handleNewMessage) {
      console.log("📨 [useSocketHandlers] Appel de handleNewMessage avec:", data);
      handleNewMessage(data);
    } else {
      console.log("⚠️ [useSocketHandlers] handleNewMessage non défini");
    }
  }, [handleNewMessage]);

  const handleTyping = useCallback((data) => {
    if (data.canalId === channelId && data.userId !== currentUserId) {
      setTypingUsers(prev => {
        if (!prev.includes(data.userName)) {
          return [...prev, data.userName];
        }
        return prev;
      });
    }
  }, [channelId, currentUserId, setTypingUsers]);

  const handleStopTyping = useCallback((data) => {
    if (data.canalId === channelId) {
      setTypingUsers(prev => prev.filter(user => user !== data.userName));
    }
  }, [channelId, setTypingUsers]);

  const handleMessageReaction = useCallback((data) => {
    if (!data || !data.messageId || !data.reactions) {
      return;
    }

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id_message === data.messageId) {
          return { ...msg, reactions: data.reactions };
        }
        return msg;
      })
    );
  }, [setMessages]);

  const handleUpdateMessage = useCallback((data) => {
    if (!data || !data.id_message) {
      return;
    }

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id_message === data.id_message) {
          return { ...msg, ...data };
        }
        return msg;
      })
    );
  }, [setMessages]);

  useEffect(() => {
    if (socket && workspaceId && channelId && currentUserId) {
      console.log("🏢 [useSocketHandlers] Initialisation des listeners socket:", { 
        workspaceId, 
        channelId, 
        currentUserId,
        socketId: socket.id,
        socketConnected: socket.connected
      });
      
      // Rejoindre le workspace et le canal
      console.log("🚀 [useSocketHandlers] Émission de joinWorkspace:", { workspaceId, userId: currentUserId });
      socket.emit('joinWorkspace', { workspaceId, userId: currentUserId });
      
      console.log("🚀 [useSocketHandlers] Émission de joinCanal:", { canalId: channelId, workspaceId });
      socket.emit('joinCanal', { canalId: channelId, workspaceId });

      // Écouter la confirmation de jointure du canal
      const handleCanalJoined = (data) => {
        console.log("✅ [useSocketHandlers] Canal rejoint avec succès:", data);
      };

      // Enregistrer tous les listeners
      console.log("🔧 [useSocketHandlers] Enregistrement des listeners socket");
      socket.on('message', handleMessage);
      socket.on('newMessage', handleMessage); // Ajouter ce listener pour plus de compatibilité
      socket.on('deleteMessage', handleDeleteMessage);
      socket.on('typing', handleTyping);
      socket.on('stopTyping', handleStopTyping);
      socket.on('connect', handleReconnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('messageReaction', handleMessageReaction);
      socket.on('updateMessage', handleUpdateMessage);
      socket.on('canalJoined', handleCanalJoined);

      return () => {
        console.log("🚪 [useSocketHandlers] Nettoyage des listeners pour le canal:", channelId);
        socket.emit('leaveCanal', { canalId: channelId, workspaceId });
        
        // Supprimer tous les listeners
        socket.off('message', handleMessage);
        socket.off('newMessage', handleMessage);
        socket.off('deleteMessage', handleDeleteMessage);
        socket.off('typing', handleTyping);
        socket.off('stopTyping', handleStopTyping);
        socket.off('connect', handleReconnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('messageReaction', handleMessageReaction);
        socket.off('updateMessage', handleUpdateMessage);
        socket.off('canalJoined', handleCanalJoined);
      };
    } else {
      console.log("⚠️ [useSocketHandlers] Conditions non remplies pour initialiser les listeners:", {
        hasSocket: !!socket,
        hasWorkspaceId: !!workspaceId,
        hasChannelId: !!channelId,
        hasCurrentUserId: !!currentUserId
      });
    }
  }, [
    socket,
    workspaceId,
    channelId,
    currentUserId,
    handleMessage,
    handleDeleteMessage,
    handleTyping,
    handleStopTyping,
    handleReconnect,
    handleDisconnect,
    handleMessageReaction,
    handleUpdateMessage
  ]);
};

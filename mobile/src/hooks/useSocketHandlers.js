import { useEffect } from 'react';

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
  useEffect(() => {
    if (socket && workspaceId && channelId && currentUserId) {
      console.log("🏢 WorkspaceDetail: Joining workspace and channel", { 
        workspaceId, 
        channelId, 
        currentUserId,
        socketId: socket.id 
      });
      
      socket.emit('joinWorkspace', { workspaceId, userId: currentUserId });
      socket.emit('joinCanal', { canalId: channelId, workspaceId });

      const handleDeleteMessage = (data) => {
        console.log("🗑️ Message supprimé:", data);
        if (data && data.messageId) {
          setMessages(prev => prev.filter(msg => msg.id_message !== data.messageId));
        }
      };

      const handleMessage = (data) => {
        console.log("📨 Nouveau message reçu:", data);
        handleNewMessage(data);
      };

      const handleTyping = (data) => {
        if (data.canalId === channelId && data.userId !== currentUserId) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
        }
      };

      const handleStopTyping = (data) => {
        if (data.canalId === channelId) {
          setTypingUsers(prev => prev.filter(user => user !== data.userName));
        }
      };

      const handleMessageReaction = (data) => {
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
      };

      const handleUpdateMessage = (data) => {
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
      };

      // Enregistrer les listeners
      socket.on('message', handleMessage);
      socket.on('deleteMessage', handleDeleteMessage);
      socket.on('typing', handleTyping);
      socket.on('stopTyping', handleStopTyping);
      socket.on('connect', handleReconnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('messageReaction', handleMessageReaction);
      socket.on('updateMessage', handleUpdateMessage);

      return () => {
        console.log("🚪 WorkspaceDetail: Leaving channel", channelId);
        socket.emit('leaveCanal', { canalId: channelId, workspaceId });
        socket.off('message', handleMessage);
        socket.off('deleteMessage', handleDeleteMessage);
        socket.off('typing', handleTyping);
        socket.off('stopTyping', handleStopTyping);
        socket.off('connect', handleReconnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('messageReaction', handleMessageReaction);
        socket.off('updateMessage', handleUpdateMessage);
      };
    }
  }, [socket, workspaceId, channelId, currentUserId]); // Supprimer les fonctions des dépendances
};

  // Démarrage auto d'une conversation si userId passé en query ou en paramètre d'URL
  useEffect(() => {
    // Vérifier d'abord les paramètres de recherche URL (query params)
    const params = new URLSearchParams(location.search);
    const userIdFromQuery = params.get("userId");

    // Vérifier ensuite si l'URL contient un ID direct comme /direct-messages/{userId}
    const pathParts = location.pathname.split("/");
    const userIdFromPath = pathParts.length > 2 ? pathParts[2] : null;

    // Utiliser l'ID de la query ou du path, avec priorité à la query
    const userId = userIdFromQuery || userIdFromPath;

    console.log(`[DM] Analyse des paramètres URL: userIdFromQuery=${userIdFromQuery}, userIdFromPath=${userIdFromPath}`);

    if (userId) {
      console.log(`[DM] ID utilisateur détecté dans l'URL: ${userId}`);
      console.log(`[DM] ID utilisateur courant: ${currentUserId}`);
      console.log(`[DM] Liste des conversations actuelles:`, conversations);
      
      // Vérifier si l'utilisateur n'est pas déjà sélectionné pour éviter un rechargement inutile
      if (userId !== selectedUser) {
        console.log(`[DM] Changement de conversation vers userId: ${userId}`);
        setSelectedUser(userId);
        
        // Si l'utilisateur n'est pas dans la liste des conversations, l'ajouter
        if (!conversations.some(conv => String(conv) === String(userId))) {
          console.log(`[DM] Ajout de l'utilisateur ${userId} à la liste des conversations`);
          setConversations(prev => [...prev, userId]);
        }
        
        // Marquer immédiatement les messages comme lus lorsqu'on navigue directement
        // depuis une notification (on fera le vrai marquage une fois les messages chargés)
        setUnreadMessageCounts(prev => ({
          ...prev,
          [userId]: 0
        }));
        
        // Récupérer les messages avec cet utilisateur
        fetchMessages(userId);
        
        // Marquer cette conversation comme vue (pour effacer les notifications)
        if (socket && socket.connected) {
          console.log(`[DM] Marquage de la conversation avec ${userId} comme lue via navigation de notification`);
          
          // Déclencher la mise à jour globale du compteur non lu
          if (refreshUnreadDM) refreshUnreadDM();
        }
      }
    }
  }, [location, selectedUser, conversations, currentUserId, socket, refreshUnreadDM, fetchMessages]);

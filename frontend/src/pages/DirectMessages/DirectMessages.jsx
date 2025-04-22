import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { 
  FaUserCircle, 
  FaPaperPlane, 
  FaPaperclip, 
  FaSmile, 
  FaSearch,
  FaPlus,
  FaTimes,
  FaReply,
  FaRegSmile
} from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./DirectMessages.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Helper pour formater la date
const formatMessageDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function DirectMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesContainerRef = useRef(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    isOwnMessage: false,
    message: null
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef(null);

  // Récupère l'ID utilisateur courant
  const currentUserId = (() => {
    try {
      return JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;
    } catch {
      return null;
    }
  })();

  // Connexion socket et joinPrivate
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("[DM] Initializing socket connection with token:", token);
    console.log("[DM] API_URL utilisé pour le socket:", API_URL);
    
    // Vérifier d'abord si l'API est accessible
    fetch(`${API_URL}/api/ping`)
      .then(response => {
        if (response.ok) console.log("[DM] Backend API /api/ping OK");
        else console.error("[DM] Backend API /api/ping ERROR:", response.status);
        return response.text();
      })
      .then(text => console.log("[DM] Ping response:", text))
      .catch(err => console.error("[DM] Backend API inaccessible:", err));
    
    // Log pour vérifier l'URL WebSocket
    console.log("[DM] Tentative WebSocket sur:", `ws://${API_URL.replace(/^https?:\/\//, '')}/socket.io/?EIO=4&transport=websocket`);
    
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 30000, // Augmenter le timeout
      forceNew: true, // Forcer une nouvelle connexion
    });
    
    // Écouter les événements de debug socket.io
    newSocket.on("connect_error", (err) => {
      console.error("[DM] Socket.io connection error:", err);
    });
    
    newSocket.on("connect", () => {
      console.log("[DM] Socket.io connecté avec succès avec ID:", newSocket.id);
      console.log("[DM] Tentative de rejoindre la room privée");
      newSocket.emit("joinPrivate");
    });

    newSocket.on("privateRoomJoined", (data) => {
      console.log("[DM] Room privée rejointe:", data);
    });
    
    newSocket.on("error", (error) => {
      console.error("[DM] Socket.io error event:", error);
    });
    
    newSocket.on("reconnect", (attempt) => {
      console.log("[DM] Socket.io reconnecté après", attempt, "tentatives");
    });
    
    newSocket.on("reconnect_attempt", (attempt) => {
      console.log("[DM] Socket.io tentative de reconnexion #", attempt);
    });
    
    newSocket.on("reconnect_error", (error) => {
      console.error("[DM] Socket.io erreur de reconnexion:", error);
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        console.log("[DM] Déconnexion du socket");
        newSocket.disconnect();
      }
    };
  }, []);

  // Réception des nouveaux messages privés en temps réel
  useEffect(() => {
    if (!socket) return;
    
    const handlePrivateMessage = (msg) => {
      console.log("Received private message:", msg);
      // Ajoute le message seulement si la conversation affichée est concernée
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser || msg.fk_destinataire === selectedUser)
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
      
      // Si c'est un nouveau message, rafraîchir la liste des conversations
      if (!conversations.includes(msg.fk_expediteur) && msg.fk_expediteur !== currentUserId) {
        fetchConversations();
      }
    };
    
    const handlePrivateMessageUpdated = (msg) => {
      console.log("Message updated:", msg);
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser || msg.fk_destinataire === selectedUser)
      ) {
        setMessages((prev) => 
          prev.map((m) => (m.id_message_prive === msg.id_message_prive ? msg : m))
        );
      }
    };
    
    const handlePrivateMessageDeleted = (data) => {
      console.log("Message deleted:", data);
      if (selectedUser) {
        setMessages((prev) => 
          prev.map((m) => 
            m.id_message_prive === data.id 
              ? { ...m, is_deleted: true, contenu: "[message supprimé]" } 
              : m
          )
        );
      }
    };
    
    const handlePrivateMessageRead = (data) => {
      console.log("Message read:", data);
      if (selectedUser) {
        setMessages((prev) => 
          prev.map((m) => 
            m.id_message_prive === data.id 
              ? { ...m, date_lecture: data.date_lecture } 
              : m
          )
        );
      }
    };
    
    socket.on("privateMessage", handlePrivateMessage);
    socket.on("privateMessageUpdated", handlePrivateMessageUpdated);
    socket.on("privateMessageDeleted", handlePrivateMessageDeleted);
    socket.on("privateMessageRead", handlePrivateMessageRead);
    
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageUpdated", handlePrivateMessageUpdated);
      socket.off("privateMessageDeleted", handlePrivateMessageDeleted);
      socket.off("privateMessageRead", handlePrivateMessageRead);
    };
  }, [socket, selectedUser, conversations, currentUserId]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Récupère la liste des utilisateurs avec qui j'ai une conversation
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/private-messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.text();
        setError(`Erreur lors de la récupération des conversations: ${err}`);
        console.error("API Error:", err);
        setConversations([]);
        return;
      }
      
      const data = await res.json();
      console.log("Conversations reçues:", data);
      setConversations(data);
      
      // Précharge les infos utilisateurs
      for (const userId of data) {
        fetchUserInfo(userId);
      }
    } catch (e) {
      setError(`Erreur réseau: ${e.message}`);
      console.error("Network Error:", e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Récupère les infos d'un utilisateur
  const fetchUserInfo = async (userId) => {
    if (usersInfo[userId]) return usersInfo[userId];
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error(`Erreur lors de la récupération des infos utilisateur ${userId}`);
        return null;
      }
      
      const data = await res.json();
      setUsersInfo((prev) => ({ ...prev, [userId]: data }));
      return data;
    } catch (e) {
      console.error(`Erreur lors de la récupération des infos utilisateur ${userId}:`, e);
      return null;
    }
  };

  // Récupère les messages d'une conversation
  const fetchMessages = async (userId) => {
    try {
      setLoadingMessages(true);
      setSelectedUser(userId);
      
      // Récupérer les informations de l'utilisateur sélectionné
      let userInfo = usersInfo[userId];
      if (!userInfo) {
        userInfo = await fetchUserInfo(userId);
      }
      setSelectedUserInfo(userInfo);
      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/private-messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        setError(`Erreur lors de la récupération des messages: ${await res.text()}`);
        setMessages([]);
        return;
      }
      
      const data = await res.json();
      console.log("Messages récupérés:", data);
      setMessages(data);
      
      // Marquer les messages non lus comme lus
      markMessagesAsRead(data);
      
    } catch (e) {
      setError(`Erreur lors de la récupération des messages: ${e.message}`);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Marquer les messages non lus comme lus
  const markMessagesAsRead = (msgs) => {
    if (!socket || !msgs || !msgs.length) return;
    
    const unreadMessages = msgs.filter(
      m => m.fk_expediteur !== currentUserId && !m.date_lecture
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        socket.emit("readPrivateMessage", { id: msg.id_message_prive });
      });
    }
  };

  // Modifiez la fonction d'envoi de message pour utiliser d'abord l'API REST puis emettre via socket
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() || !selectedUser || !socket) return;
  
  try {
    console.log("[DM] Sending message to:", selectedUser, "content:", newMessage);
    
    // 1. D'abord envoyer via l'API pour garantir la persistance
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/private-messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        destinataireId: selectedUser,
        contenu: newMessage,
        replyToId: replyingTo ? replyingTo.id_message_prive : null
      })
    });
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    // 2. Ajouter le message à l'interface utilisateur immédiatement
    const data = await res.json();
    setMessages((prev) => [...prev, data]);
    
    // 3. Essayer d'émettre via socket (ce qui est optionnel pour la persistance)
    if (socket && socket.connected) {
      socket.emit("privateMessage", {
        destinataireId: selectedUser,
        contenu: newMessage,
        replyToId: replyingTo ? replyingTo.id_message_prive : null
      }, (response) => {
        console.log("[DM] Message acknowledgement:", response);
      });
    }
    
    setNewMessage("");
    setReplyingTo(null);
  } catch (e) {
    console.error("Erreur lors de l'envoi du message:", e);
    setError(`Erreur lors de l'envoi du message: ${e.message}`);
  }
};

  // Filtre les conversations basées sur la recherche
  const filteredConversations = searchQuery.trim()
    ? conversations.filter(userId => {
        const user = usersInfo[userId] || {};
        return user.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  // Récupérer la liste de tous les utilisateurs disponibles
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        console.error("Erreur lors de la récupération des utilisateurs");
        setAvailableUsers([]);
        setFilteredUsers([]);
        return;
      }
      
      const data = await res.json();
      // Correction : les utilisateurs ont l'id sous 'id_utilisateur'
      // Exclure l'utilisateur courant et ceux déjà en conversation
      const filteredData = data.filter(user =>
        user.id_utilisateur !== currentUserId &&
        !conversations.includes(user.id_utilisateur)
      );
      setAvailableUsers(filteredData);
      setFilteredUsers(filteredData);
    } catch (e) {
      console.error("Erreur lors de la récupération des utilisateurs:", e);
      setAvailableUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (searchUserQuery.trim() === "") {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(user => 
        (user.nom || "")
          .toLowerCase()
          .includes(searchUserQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchUserQuery, availableUsers]);

  // Ouvrir le modal de nouvelle conversation
  const handleOpenNewConversation = () => {
    setShowNewConversationModal(true);
    fetchAvailableUsers();
  };

  // Démarrer une conversation avec un utilisateur
  const startConversationWith = (userId) => {
    setShowNewConversationModal(false);
    fetchMessages(userId);
    
    // Si cet utilisateur n'est pas déjà dans la liste des conversations, ajoutez-le
    if (!conversations.includes(userId)) {
      setConversations(prev => [...prev, userId]);
    }
  };

  // Gestionnaire pour le menu contextuel
  const handleMessageContextMenu = (e, msg) => {
    e.preventDefault();
    const isOwnMsg = msg.fk_expediteur === currentUserId;
    setMessageContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      messageId: msg.id_message_prive,
      isOwnMessage: isOwnMsg,
      message: msg
    });
  };

  const handleCloseMessageContextMenu = () => {
    setMessageContextMenu({...messageContextMenu, visible: false});
  };

  // Répondre à un message
  const handleReplyMessage = () => {
    setReplyingTo(messageContextMenu.message);
    setNewMessage(`@${usersInfo[messageContextMenu.message.fk_expediteur]?.name || "Utilisateur"} `);
    handleCloseMessageContextMenu();
    const inputElement = document.querySelector('.dm-input');
    if (inputElement) inputElement.focus();
  };

  // Supprimer un message
  const handleDeleteMessage = async () => {
    try {
      if (!socket || !messageContextMenu.messageId) return;
      
      socket.emit('deletePrivateMessage', { id: messageContextMenu.messageId });
      handleCloseMessageContextMenu();
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);
      setError("Erreur lors de la suppression du message");
    }
  };

  // Commencer à éditer un message
  const handleEditMessage = () => {
    setEditingMessage(messageContextMenu.message);
    setEditMessageContent(messageContextMenu.message.contenu);
    handleCloseMessageContextMenu();
  };

  // Sauvegarder les modifications d'un message
  const handleSaveEdit = async () => {
    try {
      if (!socket || !editingMessage) return;
      
      socket.emit('editPrivateMessage', {
        id: editingMessage.id_message_prive,
        contenu: editMessageContent
      });
      
      setEditingMessage(null);
      setEditMessageContent("");
    } catch (error) {
      console.error("Erreur lors de la modification du message:", error);
      setError("Erreur lors de la modification du message");
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditMessageContent("");
  };

  // Annuler la réponse
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Gérer l'ajout d'une réaction à un message
  const handleAddReaction = () => {
    setShowEmojiPicker(true);
    setEmojiPickerPosition({
      top: messageContextMenu.yPos,
      left: messageContextMenu.xPos
    });
    handleCloseMessageContextMenu();
  };

  // Gérer la sélection d'un emoji
  const handleEmojiSelect = (emoji) => {
    if (!socket || !messageContextMenu.messageId) return;
    
    socket.emit('addPrivateMessageReaction', {
      id: messageContextMenu.messageId,
      reaction: emoji
    });
    
    setShowEmojiPicker(false);
  };

  // Fermer le sélecteur d'emoji lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Correction pour l'affichage des conversations/messages après reload
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
    }
    // eslint-disable-next-line
  }, [selectedUser]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="dm-layout">
        {/* Sidebar des conversations */}
        <div className="dm-sidebar">
          <div className="dm-sidebar-header">
            <h3 className="dm-title">Messages privés</h3>
            
            <div className="dm-search">
              <div className="dm-search-input-wrapper">
                <FaSearch className="dm-search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher des conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dm-search-input"
                />
              </div>
            </div>
            
            {/* Bouton nouvelle conversation */}
            <button 
              className="dm-new-conversation-button" 
              onClick={handleOpenNewConversation}
            >
              Démarrer une conversation
            </button>
          </div>
          
          {error && <div className="dm-error">{error}</div>}
          
          <ul className="dm-conv-list">
            {loading ? (
              <li className="dm-empty">Chargement des conversations...</li>
            ) : filteredConversations.length === 0 ? (
              <li className="dm-empty">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </li>
            ) : (
              filteredConversations.map((userId) => {
                const user = usersInfo[userId] || {};
                return (
                  <li
                    key={userId}
                    className={`dm-conv-item ${selectedUser === userId ? 'active' : ''}`}
                    onClick={() => fetchMessages(userId)}
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name || "User"} 
                        className="dm-avatar" 
                      />
                    ) : (
                      <div className="dm-avatar">
                        <FaUserCircle className="dm-avatar-placeholder" />
                      </div>
                    )}
                    <span className="dm-username">{user.name || "Utilisateur"}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Zone principale des messages */}
        <div className="dm-main">
          <div className="glow-circle-right top-right"></div>
          <div className="glow-circle-left bottom-left"></div>
          
          {!selectedUser ? (
            <div className="dm-empty-msg">
              <h2>Sélectionnez une conversation</h2>
              <p>Choisissez un contact pour afficher vos messages</p>
            </div>
          ) : (
            <>
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
                      className={`status-dot ${selectedUserInfo?.status === 'online' ? 'online' : 'offline'}`}
                    ></span>
                    <span>{selectedUserInfo?.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
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
                    const user = usersInfo[isOwn ? currentUserId : msg.fk_expediteur];
                    
                    // Si c'est un message qu'on est en train d'éditer
                    if (editingMessage && editingMessage.id_message_prive === msg.id_message_prive) {
                      return (
                        <div 
                          key={msg.id_message_prive} 
                          className={`dm-message ${isOwn ? 'own' : 'other'} editing`}
                        >
                          <div className="dm-msg-avatar">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.name || "User"} />
                            ) : (
                              <div className="dm-avatar-placeholder">
                                {user?.name ? user.name[0].toUpperCase() : "U"}
                              </div>
                            )}
                          </div>
                          
                          <div className="dm-msg-content">
                            <div className="dm-edit-container">
                              <textarea
                                value={editMessageContent}
                                onChange={(e) => setEditMessageContent(e.target.value)}
                                className="dm-edit-textarea"
                                autoFocus
                              />
                              <div className="dm-edit-actions">
                                <button onClick={handleSaveEdit} className="dm-edit-save">Enregistrer</button>
                                <button onClick={handleCancelEdit} className="dm-edit-cancel">Annuler</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div 
                        key={msg.id_message_prive} 
                        className={`dm-message ${isOwn ? 'own' : 'other'}`}
                        onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                      >
                        {/* Si c'est une réponse, afficher le message parent */}
                        {msg.parent_id && (
                          <div className="dm-reply-info">
                            <div className="dm-reply-content">
                              {/* TODO: Récupérer le message parent */}
                              <span className="dm-reply-author">
                                @{usersInfo[msg.parent_expediteur]?.name || "Utilisateur"}
                              </span>
                              <span className="dm-reply-text">{msg.parent_contenu || "Message original"}</span>
                            </div>
                          </div>
                        )}
                      
                        <div className="dm-msg-avatar">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name || "User"} />
                          ) : (
                            <div className="dm-avatar-placeholder">
                              {user?.name ? user.name[0].toUpperCase() : "U"}
                            </div>
                          )}
                        </div>
                        
                        <div className="dm-msg-content">
                          <div className="dm-msg-header">
                            <span className="dm-msg-author">
                              {user?.name || "Utilisateur"}
                            </span>
                            <span className="dm-msg-date">
                              {formatMessageDate(msg.date_creation || msg.date_envoi)}
                            </span>
                          </div>
                          
                          <div className="dm-msg-bubble">
                            {msg.contenu}
                          </div>
                          
                          {isOwn && msg.date_lecture && (
                            <div className="dm-msg-read">✓ Lu</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Formulaire d'envoi de message avec zone de réponse */}
              <form className="dm-input-form" onSubmit={handleSendMessage}>
                {replyingTo && (
                  <div className="dm-replying-to">
                    <div className="dm-replying-info">
                      <span>Réponse à </span>
                      <strong>{usersInfo[replyingTo.fk_expediteur]?.name || "Utilisateur"}</strong>
                      <span className="dm-replying-content">: {replyingTo.contenu}</span>
                    </div>
                    <button 
                      type="button" 
                      className="dm-cancel-reply" 
                      onClick={handleCancelReply}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                <div className="dm-input-wrapper">
                  <button type="button" className="dm-attachment-btn">
                    <FaPaperclip />
                  </button>
                  <input
                    type="text"
                    placeholder={`Message à ${selectedUserInfo?.name || 'l\'utilisateur'}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="dm-input"
                  />
                  <button type="button" className="dm-emoji-btn">
                    <FaSmile />
                  </button>
                </div>
                <button
                  type="submit"
                  className="dm-send-btn"
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Modal pour nouvelle conversation */}
        {showNewConversationModal && (
          <div className="dm-modal-overlay">
            <div className="dm-modal">
              <div className="dm-modal-header">
                <h3>Nouvelle conversation</h3>
                <button 
                  className="dm-modal-close" 
                  onClick={() => setShowNewConversationModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="dm-modal-body">
                <div className="dm-search-input-wrapper modal">
                  <FaSearch className="dm-search-icon" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="dm-search-input"
                    autoFocus
                  />
                </div>
                
                <div className="dm-users-list">
                  {loadingUsers ? (
                    <div className="dm-loading-users">Chargement des utilisateurs...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="dm-no-users">Aucun utilisateur trouvé</div>
                  ) : (
                    filteredUsers.map(user => (
                      <div 
                        key={user.id_utilisateur} 
                        className="dm-user-item"
                        onClick={() => startConversationWith(user.id_utilisateur)}
                      >
                        {user.photo_de_profil ? (
                          <img 
                            src={user.photo_de_profil} 
                            alt={user.nom} 
                            className="dm-avatar" 
                          />
                        ) : (
                          <div className="dm-avatar">
                            <FaUserCircle className="dm-avatar-placeholder" />
                          </div>
                        )}
                        <span className="dm-username">{user.nom || `Utilisateur ${user.id_utilisateur.substring(0, 6)}`}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Menu contextuel pour les messages */}
        {messageContextMenu.visible && (
          <div 
            className="dm-context-menu"
            style={{
              top: messageContextMenu.yPos,
              left: messageContextMenu.xPos
            }}
          >
            {messageContextMenu.isOwnMessage ? (
              <>
                <div 
                  className="dm-context-menu-item" 
                  onClick={handleEditMessage}
                >
                  Modifier
                </div>
                <div 
                  className="dm-context-menu-item" 
                  onClick={handleDeleteMessage}
                >
                  Supprimer
                </div>
                <div 
                  className="dm-context-menu-item" 
                  onClick={handleReplyMessage}
                >
                  <FaReply className="dm-context-menu-icon" /> Répondre
                </div>
                <div 
                  className="dm-context-menu-item" 
                  onClick={handleAddReaction}
                >
                  <FaRegSmile className="dm-context-menu-icon" /> Ajouter une réaction
                </div>
              </>
            ) : (
              <>
                <div 
                  className="dm-context-menu-item" 
                  onClick={handleReplyMessage}
                >
                  <FaReply className="dm-context-menu-icon" /> Répondre
                </div>
                <div 
                  className="dm-context-menu-item" 
                  onClick={handleAddReaction}
                >
                  <FaRegSmile className="dm-context-menu-icon" /> Ajouter une réaction
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Sélecteur d'emoji */}
        {showEmojiPicker && (
          <div 
            className="dm-emoji-picker"
            style={{
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left
            }}
            ref={emojiPickerRef}
          >
            <div className="dm-emoji-grid">
              {["👍", "❤️", "😂", "😮", "😢", "😡"].map(emoji => (
                <div 
                  key={emoji} 
                  className="dm-emoji-item"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Couche transparente pour fermer le menu */}
        {messageContextMenu.visible && (
          <div 
            className="dm-context-menu-overlay"
            onClick={handleCloseMessageContextMenu}
          />
        )}
      </div>
    </div>
  );
}

export default DirectMessages;

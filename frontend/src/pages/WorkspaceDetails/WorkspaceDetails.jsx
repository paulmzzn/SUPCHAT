import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { FaSearch, FaPlus, FaHashtag, FaLock, FaChevronDown, FaChevronRight, FaUserCircle, FaFile, FaImage, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaGlobe, FaCrown, FaUserShield, FaUser, FaEdit, FaTrashAlt, FaPaperPlane, FaSmile, FaPaperclip, FaReply, FaRegSmile, FaThumbsUp, FaHeart, FaLaugh, FaSurprise, FaSadTear, FaAngry } from 'react-icons/fa';
import './WorkspaceDetails.css';
import { API_URL } from '../../config/config';
import io from 'socket.io-client';

function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [showChannels, setShowChannels] = useState(true);
  const [canalsLoading, setCanalsLoading] = useState(false);
  const [canalsError, setCanalsError] = useState(null);
  
  // États pour les sections de la sidebar de droite
  const [showMembers, setShowMembers] = useState(true);
  const [showOnlineMembers, setShowOnlineMembers] = useState(true);
  const [showOfflineMembers, setShowOfflineMembers] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showImages, setShowImages] = useState(true);

  // Données exemples pour la sidebar de droite avec ajout des rôles
  const [members, setMembers] = useState({
    online: [
      { id: 1, name: 'Alice Martin', avatar: null, status: 'online', role: 'owner' },
      { id: 2, name: 'Bob Johnson', avatar: null, status: 'online', role: 'admin' },
      { id: 3, name: 'Charlie Brown', avatar: null, status: 'online', role: 'member' }
    ],
    offline: [
      { id: 4, name: 'David Smith', avatar: null, status: 'offline', role: 'member' },
      { id: 5, name: 'Emily Davis', avatar: null, status: 'offline', role: 'admin' },
      { id: 6, name: 'Frank Wilson', avatar: null, status: 'offline', role: 'member' },
      { id: 7, name: 'Grace Taylor', avatar: null, status: 'offline', role: 'member' }
    ]
  });

  const [files, setFiles] = useState([
    { id: 1, name: 'presentation.pptx', type: 'powerpoint', size: '2.4 MB', uploadedBy: 'Alice Martin', uploadedAt: '2023-05-15' },
    { id: 2, name: 'budget.xlsx', type: 'excel', size: '1.8 MB', uploadedBy: 'Bob Johnson', uploadedAt: '2023-05-14' },
    { id: 3, name: 'report.pdf', type: 'pdf', size: '3.2 MB', uploadedBy: 'Charlie Brown', uploadedAt: '2023-05-13' },
    { id: 4, name: 'contract.docx', type: 'word', size: '1.5 MB', uploadedBy: 'David Smith', uploadedAt: '2023-05-12' }
  ]);

  const [images, setImages] = useState([
    { id: 1, url: 'https://picsum.photos/200?sig=1', uploadedBy: 'Alice Martin', uploadedAt: '2023-05-15' },
    { id: 2, url: 'https://picsum.photos/200?sig=2', uploadedBy: 'Bob Johnson', uploadedAt: '2023-05-14' },
    { id: 3, url: 'https://picsum.photos/200?sig=3', uploadedBy: 'Charlie Brown', uploadedAt: '2023-05-13' },
    { id: 4, url: 'https://picsum.photos/200?sig=4', uploadedBy: 'David Smith', uploadedAt: '2023-05-12' }
  ]);

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', isPrivate: false });
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState('');

  // États pour le menu contextuel des canaux
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    channelId: null,
    channelName: '',
    isPrivate: false
  });
  
  // État pour modal d'édition de canal
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState({ id: null, name: '', isPrivate: false });
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [updateChannelError, setUpdateChannelError] = useState('');

  // États pour le chat
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatContainerRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // À ajouter dans la fonction WorkspaceDetails() pour récupérer l'ID de l'utilisateur actuel
  const [currentUserId, setCurrentUserId] = useState(null);

  // État pour le menu contextuel des messages
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    message: null
  });

  // État pour la fenêtre modale de sélection d'emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // État pour le message en cours de réponse
  const [replyingTo, setReplyingTo] = useState(null);

  // Liste prédéfinie d'emojis pour les réactions
  const commonEmojis = [
    { icon: <FaThumbsUp />, name: 'thumbsUp', label: '👍' },
    { icon: <FaHeart />, name: 'heart', label: '❤️' },
    { icon: <FaLaugh />, name: 'laugh', label: '😂' },
    { icon: <FaSurprise />, name: 'surprise', label: '😮' },
    { icon: <FaSadTear />, name: 'sad', label: '😢' },
    { icon: <FaAngry />, name: 'angry', label: '😠' }
  ];

  // Fetch workspace details
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      try {
        setLoading(true);
        // Fetch workspace data
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch workspace details');
        }

        const data = await response.json();
        setWorkspace({
          id: data.id_workspace,
          name: data.nom,
          description: data.description,
          banner: data.banner_url,
          icon: data.icon_url,
          isPrivate: data.is_private
        });

        // Récupérer les canaux depuis l'API
        fetchCanals();

      } catch (err) {
        console.error('Error fetching workspace details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  // Fonction pour récupérer les canaux depuis l'API
  const fetchCanals = async () => {
    try {
      setCanalsLoading(true);
      setCanalsError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspace/${workspaceId}/canals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const data = await response.json();
      
      // Transformer les données reçues au format attendu par le composant
      const formattedChannels = data.map(canal => ({
        id: canal.id_canal,
        name: canal.nom,
        isPrivate: canal.is_private || false,
        description: canal.description || ''
      }));

      setChannels(formattedChannels);
      console.log('Canaux récupérés:', formattedChannels);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setCanalsError(err.message);
      
      // En cas d'erreur, définir des canaux vides pour éviter de crasher l'interface
      setChannels([]);
    } finally {
      setCanalsLoading(false);
    }
  };

  // Filter channels based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredChannels(channels);
      return;
    }
    
    const filtered = channels.filter(channel => 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChannels(filtered);
  }, [searchQuery, channels]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleChannelsVisibility = () => {
    setShowChannels(!showChannels);
  };

  const handleChannelInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewChannel({
      ...newChannel,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Modifier cette fonction pour éviter la fermeture de la liste des canaux
  const handleCreateChannel = (e) => {
    // Empêcher la propagation de l'événement vers le parent (section-header)
    e.stopPropagation();
    
    setShowCreateChannelModal(true);
    setNewChannel({ name: '', isPrivate: false });
    setChannelError('');
  };

  const handleCloseModal = () => {
    setShowCreateChannelModal(false);
  };

  const handleSubmitChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannel.name.trim()) {
      setChannelError('Le nom du canal est requis');
      return;
    }
    
    try {
      setIsCreatingChannel(true);
      setChannelError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspace/${workspaceId}/canals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: newChannel.name,
          is_private: newChannel.isPrivate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du canal');
      }
      
      // Récupérer les canaux mis à jour
      fetchCanals();
      
      // Fermer le modal
      setShowCreateChannelModal(false);
      
    } catch (err) {
      console.error('Erreur lors de la création du canal:', err);
      setChannelError(err.message || 'Une erreur est survenue');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // Fonctions pour basculer la visibilité des sections
  const toggleMembers = () => setShowMembers(!showMembers);
  const toggleOnlineMembers = () => setShowOnlineMembers(!showOnlineMembers);
  const toggleOfflineMembers = () => setShowOfflineMembers(!showOfflineMembers);
  const toggleFiles = () => setShowFiles(!showFiles);
  const toggleImages = () => setShowImages(!showImages);
  
  // Helper pour afficher le bon icône de fichier
  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf': return <FaFilePdf />;
      case 'word': return <FaFileWord />;
      case 'excel': return <FaFileExcel />;
      default: return <FaFileAlt />;
    }
  };

  // Function pour obtenir l'icône du rôle
  const getRoleIcon = (role) => {
    switch(role) {
      case 'owner': 
        return <FaCrown className="role-icon owner" title="Propriétaire" />;
      case 'admin': 
        return <FaUserShield className="role-icon admin" title="Administrateur" />;
      case 'member': 
        return <FaUser className="role-icon member" title="Membre" />;
      default: 
        return <FaUser className="role-icon member" title="Membre" />;
    }
  };

  // Gestionnaire pour le clic droit sur un canal
  const handleChannelContextMenu = (e, channel) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      channelId: channel.id,
      channelName: channel.name,
      isPrivate: channel.isPrivate
    });
  };

  // Gestionnaire pour fermer le menu contextuel
  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Gestionnaire pour ouvrir le modal d'édition
  const handleEditChannel = () => {
    setEditingChannel({
      id: contextMenu.channelId,
      name: contextMenu.channelName,
      isPrivate: contextMenu.isPrivate
    });
    setShowEditChannelModal(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Gestionnaire pour la soumission d'édition de canal
  const handleSubmitEditChannel = async (e) => {
    e.preventDefault();
    
    if (!editingChannel.name.trim()) {
      setUpdateChannelError('Le nom du canal est requis');
      return;
    }
    
    try {
      setIsUpdatingChannel(true);
      setUpdateChannelError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspace/${workspaceId}/canals/${editingChannel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: editingChannel.name,
          is_private: editingChannel.isPrivate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la modification du canal');
      }
      
      // Récupérer les canaux mis à jour
      fetchCanals();
      
      // Fermer le modal
      setShowEditChannelModal(false);
      
    } catch (err) {
      console.error('Erreur lors de la modification du canal:', err);
      setUpdateChannelError(err.message || 'Une erreur est survenue');
    } finally {
      setIsUpdatingChannel(false);
    }
  };

  // Gestionnaire pour la suppression d'un canal
  const handleDeleteChannel = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le canal "${contextMenu.channelName}" ?`)) {
      setContextMenu({ ...contextMenu, visible: false });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspace/${workspaceId}/canals/${contextMenu.channelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du canal');
      }
      
      // Récupérer les canaux mis à jour
      fetchCanals();
      
    } catch (err) {
      console.error('Erreur lors de la suppression du canal:', err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  // Ajout d'un effet pour fermer le menu contextuel lors d'un clic ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  // Établir la connexion socket lorsque le composant est monté
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(API_URL, {
      auth: { token }, // Assurez-vous de passer le token pour l'authentification
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  
    newSocket.on('connect', () => {
      console.log('Socket.IO connecté avec succès');
      setSocket(newSocket);
    });
  
    newSocket.on('connect_error', (err) => {
      console.error('Erreur de connexion Socket.IO:', err);
    });
  
    // Nettoyage
    return () => {
      if (newSocket) {
        console.log('Déconnexion de Socket.IO');
        newSocket.disconnect();
      }
    };
  }, []);
  
  // Écouter les nouveaux messages via socket.io
  useEffect(() => {
    if (!socket || !activeChannel) return;
  
    console.log(`Rejoindre le canal ${activeChannel.id}`);
    // Rejoindre le canal actif
    socket.emit('joinCanal', {
      canalId: activeChannel.id,
      workspaceId: workspaceId
    });
  
    // Écouter la confirmation de jointure du canal
    socket.on('canalJoined', (data) => {
      console.log('Canal rejoint:', data);
    });
  
    // Écouter les nouveaux messages 
    socket.on('message', (message) => {
      console.log('Nouveau message reçu:', message);
      
      // S'assurer que le message a toutes les propriétés nécessaires pour l'affichage
      const formattedMessage = {
        ...message,
        // S'assurer que la date est dans un format valide
        date_creation: message.date_creation || message.created_at || new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, formattedMessage]);
    });
  
    // Écouter les réactions aux messages
    socket.on('messageReaction', ({ messageId, reactions }) => {
      console.log(`Réaction reçue pour le message ${messageId}:`, reactions);
      
      // Débuguer le contenu des réactions reçues
      console.log("Détail des réactions reçues:", JSON.stringify(reactions));
      
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.id_message === messageId) {
            // S'assurer que chaque réaction a un emoji valide
            const formattedReactions = reactions.map(r => {
              // Si l'emoji est manquant, utiliser la fonction helper
              if (!r.emoji) {
                r.emoji = getEmojiForType(r.reaction_type);
                console.warn(`Emoji manquant pour ${r.reaction_type}, ajouté: ${r.emoji}`);
              }
              
              // Si l'emoji est dans un format PostgreSQL array, l'extraire
              if (typeof r.emoji === 'string' && r.emoji.startsWith('{') && r.emoji.endsWith('}')) {
                try {
                  r.emoji = JSON.parse(r.emoji.substring(1, r.emoji.length - 1));
                  console.log(`Emoji extrait du format array: ${r.emoji}`);
                } catch (e) {
                  console.warn(`Impossible de parser l'emoji: ${r.emoji}`);
                }
              }
              
              return r;
            });
            
            console.log("Réactions formatées pour UI:", formattedReactions);
            
            return { 
              ...msg, 
              reactions: formattedReactions 
            };
          }
          return msg;
        })
      );
    });
  
    return () => {
      // Quitter le canal lorsque l'utilisateur change de canal
      console.log(`Quitter le canal ${activeChannel.id}`);
      socket.off('message');
      socket.off('canalJoined');
      socket.off('messageReaction');
    };
  }, [socket, activeChannel, workspaceId]);

  // Fonction auxiliaire pour convertir un type de réaction en emoji
  const getEmojiForType = (reactionType) => {
    const emojiMap = {
      'thumbsUp': '👍',
      'heart': '❤️',
      'laugh': '😂',
      'surprise': '😮',
      'sad': '😢',
      'angry': '😠'
    };
    return emojiMap[reactionType] || reactionType;
  };

  // Faire défiler vers le bas lorsque de nouveaux messages sont reçus
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Charger les messages lors de la sélection d'un canal
  const handleSelectChannel = async (channel) => {
    try {
      setActiveChannel(channel);
      setLoadingMessages(true);
      
      const token = localStorage.getItem('token');
      console.log(`Chargement des messages pour le canal ${channel.id}...`);
      
      const response = await fetch(`${API_URL}/api/messages/canal/${channel.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        throw new Error(errorData.message || 'Erreur lors du chargement des messages');
      }
  
      const data = await response.json();
      console.log('Messages récupérés:', data);
      setMessages(data);
    } catch (error) {
      console.error('Erreur:', error);
      setMessages([]); // Afficher une liste vide plutôt qu'une erreur
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const messageData = {
        fk_canal: activeChannel.id,
        contenu: newMessage,
        parent_id: replyingTo ? replyingTo.id_message : null // Ajouter l'ID du message parent si c'est une réponse
      };
      
      console.log('Envoi du message:', messageData);
      
      // Si le socket est connecté, envoyez directement le message via WebSocket
      if (socket && socket.connected) {
        socket.emit('message', {
          canal_id: activeChannel.id,
          content: newMessage,
          workspace_id: workspaceId,
          parent_id: replyingTo ? replyingTo.id_message : null
        });
        
        setNewMessage(''); // Vider l'input
        setReplyingTo(null); // Réinitialiser l'état de réponse
        return;
      }
      
      // Fallback à l'API REST si le socket n'est pas disponible
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du message');
      }
  
      // Réinitialiser les champs
      setNewMessage('');
      setReplyingTo(null);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Fonction pour formater la date des messages - Ajoutons de la robustesse
  const formatMessageDate = (dateString) => {
    if (!dateString) {
      console.warn('formatMessageDate: date invalide', dateString);
      return '';
    }
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('formatMessageDate: date invalide', dateString);
        return '';
      }
      
      // Si c'est aujourd'hui, afficher l'heure
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Sinon, afficher la date et l'heure
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '';
    }
  };

  useEffect(() => {
    // Récupérer l'ID de l'utilisateur depuis le token JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (e) {
        console.error('Erreur lors du décodage du token:', e);
      }
    }
  }, []);

  // Gestionnaire pour afficher le menu contextuel sur un message
  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    setMessageContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      messageId: message.id_message,
      message
    });
  };

  // Gestionnaire pour fermer le menu contextuel des messages
  const handleCloseMessageContextMenu = () => {
    setMessageContextMenu({
      ...messageContextMenu,
      visible: false
    });
  };

  // Gestionnaire pour répondre à un message
  const handleReplyMessage = () => {
    setReplyingTo(messageContextMenu.message);
    setNewMessage(`@${messageContextMenu.message.nom} `);
    handleCloseMessageContextMenu();
    
    // Focus sur l'input de message
    const messageInput = document.querySelector('.chat-input-wrapper input');
    if (messageInput) {
      messageInput.focus();
    }
  };

  // Gestionnaire pour afficher le sélecteur d'emoji
  const handleShowEmojiPicker = () => {
    setShowEmojiPicker(true);
    handleCloseMessageContextMenu();
  };

  // Gestionnaire pour ajouter une réaction
  const handleAddReaction = async (emojiName) => {
    try {
      if (!messageContextMenu.messageId) return;
      
      // Utiliser WebSocket pour envoyer la réaction
      if (socket && socket.connected) {
        // Utiliser le type de réaction normalisé
        socket.emit('addReaction', {
          messageId: messageContextMenu.messageId,
          reaction_type: emojiName,
          canalId: activeChannel.id
        });
        
        // Optimistic UI update - mettre à jour l'interface avant la confirmation du serveur
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.id_message === messageContextMenu.messageId) {
              // Vérifier si cette réaction existe déjà
              const existingReactionIndex = 
                (msg.reactions || []).findIndex(r => r.reaction_type === emojiName);
              
              let updatedReactions = [...(msg.reactions || [])];
              
              if (existingReactionIndex >= 0) {
                // Incrémenter le compteur si la réaction existe
                updatedReactions[existingReactionIndex] = {
                  ...updatedReactions[existingReactionIndex],
                  count: (parseInt(updatedReactions[existingReactionIndex].count) || 0) + 1,
                  user_reacted: true
                };
              } else {
                // Ajouter une nouvelle réaction si elle n'existe pas
                updatedReactions.push({
                  reaction_type: emojiName,
                  count: 1,
                  user_reacted: true,
                  emoji: getEmojiForType(emojiName)
                });
              }
              
              return {
                ...msg,
                reactions: updatedReactions
              };
            }
            return msg;
          })
        );
        
        setShowEmojiPicker(false);
        return;
      }
      
      // Fallback à l'API REST si WebSocket n'est pas disponible
      const token = localStorage.getItem('token');
      console.log(`Ajout d'une réaction ${emojiName} au message ${messageContextMenu.messageId}`);
      
      const response = await fetch(`${API_URL}/api/messages/${messageContextMenu.messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reaction_type: emojiName
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de la réaction');
      }
      
      // Actualiser les messages pour afficher la nouvelle réaction
      if (activeChannel) {
        handleSelectChannel(activeChannel);
      }
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setShowEmojiPicker(false);
    }
  };

  // Gestionnaire pour annuler une réponse
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Effet pour fermer le menu contextuel des messages lors d'un clic ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      if (messageContextMenu.visible) {
        setMessageContextMenu({ ...messageContextMenu, visible: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [messageContextMenu.visible]);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="workspace-details-container">
          <div className="loading">Chargement des détails du workspace...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="workspace-details-container">
          <div className="error">Erreur : {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="workspace-detail-layout">
        {/* Workspace Sidebar */}
        <div className="workspace-sidebar">
          <div className="workspace-sidebar-header">
            <div className="workspace-profile">
              {workspace && (
                <>
                  <div className="workspace-avatar" style={{ backgroundImage: `url(${workspace.icon})` }}></div>
                  <h2 className="workspace-name">{workspace.name}</h2>
                </>
              )}
            </div>
            
            <div className="workspace-search">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Rechercher des canaux..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
            </div>
          </div>
          
          <div className="workspace-sidebar-content">
            <div className="channels-section">
              <div className="section-header" onClick={toggleChannelsVisibility}>
                {showChannels ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                <h3>Canaux</h3>
                {/* Modifier ici pour éviter la propagation du clic */}
                <button className="add-channel-btn" onClick={handleCreateChannel}>
                  <FaPlus />
                </button>
              </div>
              
              {showChannels && (
                <ul className="channels-list">
                  {canalsLoading ? (
                    <li className="channel-loading">Chargement des canaux...</li>
                  ) : canalsError ? (
                    <li className="channel-error">Erreur: {canalsError}</li>
                  ) : filteredChannels.length > 0 ? (
                    filteredChannels.map(channel => (
                      <li 
                        key={channel.id} 
                        className={`channel-item ${activeChannel && activeChannel.id === channel.id ? 'active' : ''}`}
                        onClick={() => handleSelectChannel(channel)}
                        onContextMenu={(e) => handleChannelContextMenu(e, channel)}
                      >
                        {channel.isPrivate ? <FaLock className="channel-icon" /> : <FaHashtag className="channel-icon" />}
                        <span className="channel-name">{channel.name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="no-channels">Aucun canal trouvé</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Area - Modified for chat */}
        <div className="workspace-content-area">
          <div className="glow-circle-right top-right"></div>
          <div className="glow-circle-left bottom-left"></div>
          
          {!activeChannel ? (
            <div className="workspace-welcome">
              <h1>Bienvenue sur {workspace?.name}</h1>
              <p>Sélectionnez un canal pour commencer à discuter</p>
            </div>
          ) : (
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-header-info">
                  {activeChannel.isPrivate ? <FaLock className="chat-header-icon" /> : <FaHashtag className="chat-header-icon" />}
                  <h2>{activeChannel.name}</h2>
                </div>
                <div className="chat-header-actions">
                  <button className="header-action-btn">
                    <FaUserCircle />
                    <span>Membres</span>
                  </button>
                </div>
              </div>
              
              <div className="chat-messages" ref={chatContainerRef}>
                {loadingMessages ? (
                  <div className="chat-loading">Chargement des messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div 
                      key={message.id_message} 
                      className={`chat-message ${message.fk_utilisateur === currentUserId ? 'own-message' : 'other-message'}`}
                      onContextMenu={(e) => handleMessageContextMenu(e, message)}
                    >
                      <div className="message-avatar">
                        {message.photo_de_profil ? (
                          <img src={message.photo_de_profil} alt={message.nom} />
                        ) : (
                          <div className="avatar-placeholder">{message.nom ? message.nom[0].toUpperCase() : '?'}</div>
                        )}
                      </div>
                      <div className="message-content">
                        {/* Affichage amélioré du message parent s'il s'agit d'une réponse */}
                        {message.parent_message && (
                          <div className="message-reply-to" onClick={() => {
                            // Trouver le message parent dans la liste et faire défiler vers lui
                            const parentMessage = messages.find(m => m.id_message === message.parent_id);
                            if (parentMessage) {
                              const element = document.getElementById(`msg-${message.parent_id}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Ajouter une classe pour le mettre en évidence temporairement
                                element.classList.add('highlight-message');
                                setTimeout(() => element.classList.remove('highlight-message'), 2000);
                              }
                            }
                          }}>
                            <FaReply className="reply-icon" />
                            <div className="reply-content">
                              <span className="reply-author">@{message.parent_message.nom}</span>
                              <span className="reply-text">{message.parent_message.contenu}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="message-header">
                          <span className="message-author">{message.nom}</span>
                          <span className="message-time">{formatMessageDate(message.date_creation)}</span>
                        </div>
                        <p className="message-text">{message.contenu}</p>
                        
                        {/* Afficher les réactions avec meilleur style */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="message-reactions">
                            {message.reactions.map((reaction, index) => (
                              <div 
                                key={index} 
                                className="reaction-badge"
                                onClick={() => {
                                  // Toggle de réaction
                                  if (socket && socket.connected) {
                                    if (reaction.user_reacted) {
                                      socket.emit('removeReaction', {
                                        messageId: message.id_message,
                                        reaction_type: reaction.reaction_type,
                                        canalId: activeChannel.id
                                      });
                                    } else {
                                      socket.emit('addReaction', {
                                        messageId: message.id_message,
                                        reaction_type: reaction.reaction_type,
                                        canalId: activeChannel.id
                                      });
                                    }
                                  }
                                }}
                              >
                                <span className="reaction-emoji">
                                  {reaction.emoji || getEmojiForType(reaction.reaction_type)}
                                </span>
                                <span className="reaction-count">{reaction.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-messages">
                    <p>Aucun message dans ce canal.</p>
                    <p>Envoyez le premier message !</p>
                  </div>
                )}
              </div>
              
              <form className="chat-input-container" onSubmit={handleSendMessage}>
                {/* Afficher l'indicateur de réponse si on répond à un message */}
                {replyingTo && (
                  <div className="replying-to">
                    <div className="reply-info">
                      <FaReply className="reply-icon" />
                      <span>Réponse à <strong>{replyingTo.nom}</strong></span>
                    </div>
                    <button type="button" className="cancel-reply" onClick={handleCancelReply}>
                      ×
                    </button>
                  </div>
                )}
                
                <div className="chat-input-wrapper">
                  <button type="button" className="chat-attachment-btn">
                    <FaPaperclip />
                  </button>
                  <input 
                    type="text" 
                    placeholder={`Message dans ${activeChannel.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="button" className="chat-emoji-btn" onClick={() => setShowEmojiPicker(true)}>
                    <FaSmile />
                  </button>
                </div>
                <button 
                  type="submit" 
                  className="chat-send-btn"
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Details Sidebar - UPDATED with role icons */}
        <div className="details-sidebar">
          {/* Members Section - RESTRUCTURED */}
          <div className="details-section">
            <div className="section-header" onClick={toggleMembers}>
              {showMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
              <h3>Membres ({members.online.length + members.offline.length})</h3>
            </div>
            
            {showMembers && (
              <div className="members-container">
                {/* Online Members Subsection */}
                <div className="members-subsection">
                  <div className="subsection-header" onClick={toggleOnlineMembers}>
                    {showOnlineMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                    <h4>En ligne ({members.online.length})</h4>
                  </div>
                  
                  {showOnlineMembers && (
                    <ul className="members-list">
                      {members.online.map(member => (
                        <li key={member.id} className="member-item online">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="member-avatar" />
                          ) : (
                            <FaUserCircle className="member-avatar-placeholder" />
                          )}
                          <div className="member-info">
                            {getRoleIcon(member.role)}
                            <span className="member-name">{member.name}</span>
                          </div>
                          <span className="status-indicator online"></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Offline Members Subsection */}
                <div className="members-subsection">
                  <div className="subsection-header" onClick={toggleOfflineMembers}>
                    {showOfflineMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                    <h4>Hors ligne ({members.offline.length})</h4>
                  </div>
                  
                  {showOfflineMembers && (
                    <ul className="members-list">
                      {members.offline.map(member => (
                        <li key={member.id} className="member-item offline">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="member-avatar" />
                          ) : (
                            <FaUserCircle className="member-avatar-placeholder" />
                          )}
                          <div className="member-info">
                            {getRoleIcon(member.role)}
                            <span className="member-name">{member.name}</span>
                          </div>
                          <span className="status-indicator offline"></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Files Section - NO CHANGE */}
          <div className="details-section">
            <div className="section-header" onClick={toggleFiles}>
              {showFiles ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
              <h3>Fichiers ({files.length})</h3>
            </div>
            
            {showFiles && (
              <ul className="files-list">
                {files.map(file => (
                  <li key={file.id} className="file-item">
                    <div className="file-icon">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-meta">{file.size} • {file.uploadedAt}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Images Section - NO CHANGE */}
          <div className="details-section">
            <div className="section-header" onClick={toggleImages}>
              {showImages ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
              <h3>Images ({images.length})</h3>
            </div>
            
            {showImages && (
              <div className="images-grid">
                {images.map(image => (
                  <div key={image.id} className="image-item">
                    <img src={image.url} alt="Shared" className="shared-image" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de création de canal - Structure améliorée */}
        {showCreateChannelModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Nouveau canal</h2>
              
              {channelError && (
                <p className="error-message">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                    <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="#ff6b6b" strokeWidth="1.5" />
                    <path d="M8 5v3" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.5" fill="#ff6b6b" />
                  </svg>
                  {channelError}
                </p>
              )}
              
              <form onSubmit={handleSubmitChannel}>
                <div className="form-group">
                  <label htmlFor="name">Nom du canal</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newChannel.name}
                    onChange={handleChannelInputChange}
                    placeholder="ex: general, marketing, dev..."
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label>Visibilité du canal</label>
                  <div className="channel-visibility-selector">
                    <button
                      type="button"
                      className={`visibility-option ${!newChannel.isPrivate ? 'selected' : ''}`}
                      onClick={() => setNewChannel(prev => ({ ...prev, isPrivate: false }))}
                    >
                      <FaGlobe className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Public</span>
                        <span className="visibility-desc">Accessible à tous les membres</span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      className={`visibility-option ${newChannel.isPrivate ? 'selected' : ''}`}
                      onClick={() => setNewChannel(prev => ({ ...prev, isPrivate: true }))}
                    >
                      <FaLock className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Privé</span>
                        <span className="visibility-desc">Accessible sur invitation</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={handleCloseModal} className="cancel-btn">
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="create-btn"
                    disabled={isCreatingChannel}
                  >
                    {isCreatingChannel ? 'Création...' : 'Créer le canal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu contextuel pour les canaux */}
        {contextMenu.visible && (
          <div 
            className="channel-context-menu"
            style={{ top: contextMenu.yPos, left: contextMenu.xPos }}
            onClick={e => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={handleEditChannel}>
              <FaEdit className="context-menu-icon" />
              <span>Modifier le canal</span>
            </div>
            <div className="context-menu-item delete" onClick={handleDeleteChannel}>
              <FaTrashAlt className="context-menu-icon" />
              <span>Supprimer le canal</span>
            </div>
          </div>
        )}
        
        {/* Modal d'édition de canal */}
        {showEditChannelModal && (
          <div className="modal-overlay" onClick={() => setShowEditChannelModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Modifier le canal</h2>
              
              {updateChannelError && (
                <p className="error-message">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                    <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="#ff6b6b" strokeWidth="1.5" />
                    <path d="M8 5v3" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.5" fill="#ff6b6b" />
                  </svg>
                  {updateChannelError}
                </p>
              )}
              
              <form onSubmit={handleSubmitEditChannel}>
                <div className="form-group">
                  <label htmlFor="edit-name">Nom du canal</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingChannel.name}
                    onChange={(e) => setEditingChannel({...editingChannel, name: e.target.value})}
                    placeholder="ex: general, marketing, dev..."
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label>Visibilité du canal</label>
                  <div className="channel-visibility-selector">
                    <button
                      type="button"
                      className={`visibility-option ${!editingChannel.isPrivate ? 'selected' : ''}`}
                      onClick={() => setEditingChannel(prev => ({ ...prev, isPrivate: false }))}
                    >
                      <FaGlobe className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Public</span>
                        <span className="visibility-desc">Accessible à tous les membres</span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      className={`visibility-option ${editingChannel.isPrivate ? 'selected' : ''}`}
                      onClick={() => setEditingChannel(prev => ({ ...prev, isPrivate: true }))}
                    >
                      <FaLock className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Privé</span>
                        <span className="visibility-desc">Accessible sur invitation</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowEditChannelModal(false)} className="cancel-btn">
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="create-btn"
                    disabled={isUpdatingChannel}
                  >
                    {isUpdatingChannel ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu contextuel pour les messages */}
        {messageContextMenu.visible && (
          <div 
            className="message-context-menu"
            style={{ top: messageContextMenu.yPos, left: messageContextMenu.xPos }}
            onClick={e => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={handleReplyMessage}>
              <FaReply className="context-menu-icon" />
              <span>Répondre</span>
            </div>
            <div className="context-menu-item" onClick={handleShowEmojiPicker}>
              <FaRegSmile className="context-menu-icon" />
              <span>Ajouter une réaction</span>
            </div>
          </div>
        )}
        
        {/* Modal pour la sélection d'emoji */}
        {showEmojiPicker && (
          <div className="modal-overlay" onClick={() => setShowEmojiPicker(false)}>
            <div className="emoji-picker-modal" onClick={e => e.stopPropagation()}>
              <h3>Choisissez une réaction</h3>
              <div className="emoji-grid">
                {commonEmojis.map((emoji) => (
                  <button 
                    key={emoji.name} 
                    className="emoji-button"
                    onClick={() => handleAddReaction(emoji.name)}
                    title={emoji.name}
                  >
                    {emoji.label}
                  </button>
                ))}
              </div>
              <div className="emoji-picker-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowEmojiPicker(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkspaceDetails;

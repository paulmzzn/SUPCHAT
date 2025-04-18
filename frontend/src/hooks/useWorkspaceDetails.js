import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config/config';
import { FaThumbsUp, FaHeart, FaLaugh, FaSurprise, FaSadTear, FaAngry, FaRobot } from 'react-icons/fa'; // Added FaRobot for consistency

// Helper function to get emoji for reaction type
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

const MISTRAL_USER_ID = '00000000-0000-0000-0000-000000000001';
const MISTRAL_USERNAME = 'Mistral AI';
const MISTRAL_AVATAR = 'https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp';

export const useWorkspaceDetails = (workspaceId) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [showChannels, setShowChannels] = useState(true);
  const [canalsLoading, setCanalsLoading] = useState(false);
  const [canalsError, setCanalsError] = useState(null);
  
  // States for right sidebar sections
  const [showMembers, setShowMembers] = useState(true);
  const [showOnlineMembers, setShowOnlineMembers] = useState(true);
  const [showOfflineMembers, setShowOfflineMembers] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showImages, setShowImages] = useState(true);

  // Member loading state
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // Members state
  const [members, setMembers] = useState({
    online: [],
    offline: []
  });

  // Files and Images (using placeholder data for now)
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

  // Create Channel Modal state
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', isPrivate: false });
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState('');

  // Channel Context Menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    channelId: null,
    channelName: '',
    isPrivate: false
  });
  
  // Edit Channel Modal state
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState({ id: null, name: '', isPrivate: false });
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [updateChannelError, setUpdateChannelError] = useState('');

  // Chat state
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatContainerRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Current User ID state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');

  // Message Context Menu state
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    message: null
  });

  // Emoji Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Replying state
  const [replyingTo, setReplyingTo] = useState(null);

  // Common Emojis for reactions
  const commonEmojis = [
    { icon: <FaThumbsUp />, name: 'thumbsUp', label: '👍' },
    { icon: <FaHeart />, name: 'heart', label: '❤️' },
    { icon: <FaLaugh />, name: 'laugh', label: '😂' },
    { icon: <FaSurprise />, name: 'surprise', label: '😮' },
    { icon: <FaSadTear />, name: 'sad', label: '😢' },
    { icon: <FaAngry />, name: 'angry', label: '😠' }
  ];

  const [isMistralTyping, setIsMistralTyping] = useState(false); // State for typing indicator

  // Mention state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  // Fetch canals function using useCallback
  const fetchCanals = useCallback(async () => {
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
      setChannels([]);
    } finally {
      setCanalsLoading(false);
    }
  }, [workspaceId]);

  // Fetch workspace members function using useCallback
  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setMembersError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspace members');
      }

      const data = await response.json();
      console.log('Workspace members:', data);
      
      const onlineMembers = data.filter(member => member.status === 1).map(member => ({
        id: member.id_utilisateur,
        name: member.nom,
        avatar: member.photo_de_profil || null,
        status: 'online',
        role: member.role.toLowerCase()
      }));
      
      const offlineMembers = data.filter(member => member.status !== 1).map(member => ({
        id: member.id_utilisateur,
        name: member.nom,
        avatar: member.photo_de_profil || null,
        status: 'offline',
        role: member.role.toLowerCase()
      }));
      
      setMembers({
        online: onlineMembers,
        offline: offlineMembers
      });
      
    } catch (err) {
      console.error('Error fetching workspace members:', err);
      setMembersError(err.message);
      setMembers({ online: [], offline: [] });
    } finally {
      setLoadingMembers(false);
    }
  }, [workspaceId]);

  // Fetch workspace details effect
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      try {
        setLoading(true);
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

        fetchCanals();
        fetchWorkspaceMembers();

      } catch (err) {
        console.error('Error fetching workspace details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId, fetchCanals, fetchWorkspaceMembers]);

  // Fetch current user details effect
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user info');
        
        const userData = await response.json();
        setCurrentUserName(userData.nom || userData.name);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Filter channels effect
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

  // Socket connection effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(API_URL, {
      auth: { token },
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
  
    return () => {
      if (newSocket) {
        console.log('Déconnexion de Socket.IO');
        newSocket.disconnect();
      }
    };
  }, []);

  // Socket message listener effect
  useEffect(() => {
    if (!socket || !activeChannel) return;
  
    console.log(`Rejoindre le canal ${activeChannel.id}`);
    socket.emit('joinCanal', {
      canalId: activeChannel.id,
      workspaceId: workspaceId
    });
  
    socket.on('canalJoined', (data) => {
      console.log('Canal rejoint:', data);
    });
  
    socket.on('message', (message) => {
      console.log('Nouveau message reçu (brut):', message);
      // Log spécifique pour le contenu du bot
      if (message.isBot) {
        console.log('Contenu brut du message BOT:', message.contenu);
      }
      
      // Si c'est une réponse, vérifier si nous avons l'accès au message parent
      if (message.parent_id) {
        console.log(`Message de réponse reçu, parent_id: ${message.parent_id}`);
        
        // Si le message n'a pas de parent_message mais a un parent_id, essayer de trouver le parent dans les messages existants
        if (!message.parent_message) {
          console.log(`Le message ${message.id_message} n'a pas de parent_message, recherche dans les messages existants`);
          
          setMessages(prevMessages => {
            // Trouver le message parent parmi les messages existants
            const parentMessage = prevMessages.find(msg => msg.id_message === message.parent_id);
            
            if (parentMessage) {
              console.log(`Message parent trouvé pour ${message.id_message}:`, parentMessage.nom);
              // Créer un nouveau message avec le parent_message ajouté
              const enrichedMessage = {
                ...message,
                date_creation: message.date_creation || message.created_at || new Date().toISOString(),
                fk_utilisateur: message.fk_utilisateur || (message.isBot ? '00000000-0000-0000-0000-000000000001' : null),
                reactions: message.reactions || [],
                parent_message: {
                  id_message: parentMessage.id_message,
                  nom: parentMessage.nom,
                  contenu: parentMessage.contenu
                }
              };
              
              return [...prevMessages, enrichedMessage];
            } else {
              console.log(`Message parent non trouvé pour ${message.id_message}`);
              // Ajouter le message tel quel si le parent n'est pas trouvé
              const formattedMessage = {
                ...message,
                date_creation: message.date_creation || message.created_at || new Date().toISOString(),
                fk_utilisateur: message.fk_utilisateur || (message.isBot ? '00000000-0000-0000-0000-000000000001' : null),
                reactions: message.reactions || []
              };
              
              return [...prevMessages, formattedMessage];
            }
          });
          
          return; // Sortir pour éviter l'ajout en double
        }
      }
      
      // Ensure the message structure is consistent with those loaded from DB
      const formattedMessage = {
        ...message,
        date_creation: message.date_creation || message.created_at || new Date().toISOString(),
        // Make sure fk_utilisateur is always present for CSS styling to work properly
        fk_utilisateur: message.fk_utilisateur || (message.isBot ? '00000000-0000-0000-0000-000000000001' : null),
        // Reactions field is required to prevent errors
        reactions: message.reactions || []
      };
      
      setMessages(prevMessages => [...prevMessages, formattedMessage]);
    });
  
    socket.on('messageReaction', ({ messageId, reactions }) => {
      console.log(`Réaction reçue pour le message ${messageId}:`, reactions);
      console.log("Détail des réactions reçues:", JSON.stringify(reactions));
      
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.id_message === messageId) {
            const formattedReactions = reactions.map(r => {
              if (!r.emoji) {
                r.emoji = getEmojiForType(r.reaction_type);
                console.warn(`Emoji manquant pour ${r.reaction_type, ajouté}: ${r.emoji}`);
              }
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
            return { ...msg, reactions: formattedReactions };
          }
          return msg;
        })
      );
    });

    // Add listener for deleted messages
    socket.on('messageDeleted', ({ messageId }) => {
      console.log(`Socket event 'messageDeleted' received for message ${messageId}`);
      setMessages(prevMessages => 
        prevMessages.filter(message => message.id_message !== messageId)
      );
    });

    // Add another listener for 'deleteMessage' event (in case server uses this instead)
    socket.on('deleteMessage', ({ messageId }) => {
      console.log(`Socket event 'deleteMessage' received for message ${messageId}`);
      setMessages(prevMessages => 
        prevMessages.filter(message => message.id_message !== messageId)
      );
    });

    // *** Listen for typing events ***
    socket.on('typing', ({ userId, username }) => {
      // Check if it's the Mistral bot typing
      if (userId === '00000000-0000-0000-0000-000000000001') { // Use the Mistral Bot UUID
        setIsMistralTyping(true);
      }
      // You could extend this to show other users typing too
    });

    socket.on('stopTyping', ({ userId }) => {
      if (userId === '00000000-0000-0000-0000-000000000001') { // Use the Mistral Bot UUID
        setIsMistralTyping(false);
      }
    });
    // *** End typing event listeners ***
  
    return () => {
      console.log(`Quitter le canal ${activeChannel.id}`);
      socket.off('message');
      socket.off('canalJoined');
      socket.off('messageReaction');
      socket.off('messageDeleted'); // Remove the listener
      socket.off('deleteMessage'); // Make sure to remove both listeners
      socket.off('typing'); // Clean up listeners
      socket.off('stopTyping'); // Clean up listeners
      setIsMistralTyping(false); // Reset typing state when changing channels
    };
  }, [socket, activeChannel, workspaceId]);

  // Scroll to bottom effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Get current user ID effect
  useEffect(() => {
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

  // Close context menus effect
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
      if (messageContextMenu.visible) {
        setMessageContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible, messageContextMenu.visible]);

  // Update mentionable users when members change
  useEffect(() => {
    const mistralUser = {
      id: MISTRAL_USER_ID,
      name: MISTRAL_USERNAME,
      avatar: MISTRAL_AVATAR,
      role: 'bot',
      isBot: true,
      status: 'online'
    };
    
    // Format online members
    const onlineUsers = members.online.map(member => ({
      ...member,
      status: 'online'
    }));
    
    // Format offline members
    const offlineUsers = members.offline.map(member => ({
      ...member,
      status: 'offline'
    }));
    
    const allUsers = [
      mistralUser,
      ...onlineUsers,
      ...offlineUsers,
    ];
    
    // Remove duplicates
    const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.id, user])).values());
    setMentionableUsers(uniqueUsers);
  }, [members]);

  // Handlers
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const toggleChannelsVisibility = () => setShowChannels(!showChannels);
  const toggleMembers = () => setShowMembers(!showMembers);
  const toggleOnlineMembers = () => setShowOnlineMembers(!showOnlineMembers);
  const toggleOfflineMembers = () => setShowOfflineMembers(!showOfflineMembers);
  const toggleFiles = () => setShowFiles(!showFiles);
  const toggleImages = () => setShowImages(!showImages);

  const handleChannelInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewChannel({
      ...newChannel,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateChannel = (e) => {
    e.stopPropagation();
    setShowCreateChannelModal(true);
    setNewChannel({ name: '', isPrivate: false });
    setChannelError('');
  };

  const handleCloseModal = () => setShowCreateChannelModal(false);

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
      fetchCanals();
      setShowCreateChannelModal(false);
    } catch (err) {
      console.error('Erreur lors de la création du canal:', err);
      setChannelError(err.message || 'Une erreur est survenue');
    } finally {
      setIsCreatingChannel(false);
    }
  };

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

  const handleCloseContextMenu = () => setContextMenu({ ...contextMenu, visible: false });

  const handleEditChannel = () => {
    setEditingChannel({
      id: contextMenu.channelId,
      name: contextMenu.channelName,
      isPrivate: contextMenu.isPrivate
    });
    setShowEditChannelModal(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

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
      fetchCanals();
      setShowEditChannelModal(false);
    } catch (err) {
      console.error('Erreur lors de la modification du canal:', err);
      setUpdateChannelError(err.message || 'Une erreur est survenue');
    } finally {
      setIsUpdatingChannel(false);
    }
  };

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
      fetchCanals();
      if (activeChannel && activeChannel.id === contextMenu.channelId) {
        setActiveChannel(null); // Désélectionner le canal s'il est supprimé
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du canal:', err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleSelectChannel = useCallback(async (channel) => {
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
      
      // Vérifier et logger les messages avec parent_id mais sans parent_message
      const messagesWithParentId = data.filter(msg => msg.parent_id && !msg.parent_message);
      if (messagesWithParentId.length > 0) {
        console.log(`${messagesWithParentId.length} messages ont un parent_id sans parent_message dans ce canal`);
      }
      
      setMessages(data);
    } catch (error) {
      console.error('Erreur:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !socket || !socket.connected) return;
    
    try {
      socket.emit('message', {
        canal_id: activeChannel.id,
        content: newMessage,
        workspace_id: workspaceId,
        parent_id: replyingTo ? replyingTo.id_message : null
      });
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message via socket:', error);
      // Optionally handle fallback or error display
    }
  };

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

  const handleCloseMessageContextMenu = () => setMessageContextMenu({ ...messageContextMenu, visible: false });

  const handleReplyMessage = () => {
    setReplyingTo(messageContextMenu.message);
    setNewMessage(`@${messageContextMenu.message.nom} `);
    handleCloseMessageContextMenu();
    const messageInput = document.querySelector('.chat-input-wrapper input');
    if (messageInput) messageInput.focus();
  };

  const handleShowEmojiPicker = () => {
    setShowEmojiPicker(true);
    handleCloseMessageContextMenu();
  };

  const handleAddReaction = async (emojiName) => {
    try {
      if (!messageContextMenu.messageId || !socket || !socket.connected) return;
      
      socket.emit('addReaction', {
        messageId: messageContextMenu.messageId,
        reaction_type: emojiName,
        canalId: activeChannel.id
      });
      
      // Optimistic UI update
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.id_message === messageContextMenu.messageId) {
            const existingReactionIndex = (msg.reactions || []).findIndex(r => r.reaction_type === emojiName);
            let updatedReactions = [...(msg.reactions || [])];
            if (existingReactionIndex >= 0) {
              updatedReactions[existingReactionIndex] = {
                ...updatedReactions[existingReactionIndex],
                count: (parseInt(updatedReactions[existingReactionIndex].count) || 0) + 1,
                user_reacted: true
              };
            } else {
              updatedReactions.push({
                reaction_type: emojiName,
                count: 1,
                user_reacted: true,
                emoji: getEmojiForType(emojiName)
              });
            }
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction via socket:', error);
    }
  };

  const handleCancelReply = () => setReplyingTo(null);

  const handleDeleteMessage = async () => {
    try {
      if (!messageContextMenu.messageId || !socket || !socket.connected) return;
      
      // Verify the message belongs to the current user
      const message = messages.find(m => m.id_message === messageContextMenu.messageId);
      if (!message || message.fk_utilisateur !== currentUserId) {
        console.error("Vous ne pouvez pas supprimer les messages d'autres utilisateurs");
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token d'authentification manquant");
        return;
      }
      
      // Store message ID before closing context menu
      const messageIdToDelete = messageContextMenu.messageId;
      const channelId = activeChannel.id;
      
      // Close context menu first for better UX
      handleCloseMessageContextMenu();
      
      // Update UI immediately (optimistic update)
      setMessages(prevMessages => 
        prevMessages.filter(m => m.id_message !== messageIdToDelete)
      );
      
      // Delete on server via REST API first
      console.log(`Suppression du message ${messageIdToDelete} via API REST`);
      const response = await fetch(`${API_URL}/api/messages/${messageIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting message: ${response.status}`);
      }
      
      // If API call succeeds, broadcast deletion via socket
      console.log(`Message ${messageIdToDelete} supprimé avec succès`);
      
      // Use consistent event name - ONLY use deleteMessage (not messageDeleted)
      console.log(`Émission de l'événement deleteMessage pour le message ${messageIdToDelete}`);
      socket.emit('deleteMessage', {
        messageId: messageIdToDelete,
        canalId: channelId,
        workspaceId: workspaceId // Add workspace ID to help with routing
      });
      
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      
      // If error occurs, notify user
      alert("Erreur lors de la suppression: " + error.message);
      
      // Refresh the channel to ensure UI is in sync with the server
      if (activeChannel) {
        handleSelectChannel(activeChannel);
      }
    }
  };

  // Handler for chat input changes to detect mentions
  const handleNewMessageChange = (value) => {
    setNewMessage(value);

    const inputElement = document.querySelector('.chat-input-wrapper input');
    if (!inputElement) return;
    
    const cursorPos = inputElement.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    // Check if we're inside a word
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const lastBreakIndex = Math.max(lastSpaceIndex, lastNewlineIndex);
    
    // Detect if @ is at the start of a word
    if (lastAtIndex !== -1 && (lastAtIndex > lastBreakIndex || lastBreakIndex === -1)) {
      const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
      setMentionQuery(query);

      if (mentionableUsers.length > 0) {
        // Filter users by query
        const filtered = mentionableUsers.filter(user =>
          user.name.toLowerCase().includes(query)
        );
        
        // Sort results: online first, then alphabetically, bot always at the top
        const sorted = [...filtered].sort((a, b) => {
          // Bots first
          if (a.isBot && !b.isBot) return -1;
          if (!a.isBot && b.isBot) return 1;
          
          // Online users before offline
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          
          // Alphabetical sort
          return a.name.localeCompare(b.name);
        });
        
        setMentionSuggestions(sorted.slice(0, 5)); // Limit suggestions
        setShowMentionSuggestions(sorted.length > 0);
        setActiveMentionIndex(0); // Reset active index
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
    }
  };

  // Handler for keyboard navigation in mention suggestions
  const handleMentionNavigation = (direction) => {
    if (mentionSuggestions.length === 0) return;
    
    setActiveMentionIndex(currentIndex => {
      if (direction === 'next') {
        return (currentIndex + 1) % mentionSuggestions.length;
      } else {
        return (currentIndex - 1 + mentionSuggestions.length) % mentionSuggestions.length;
      }
    });
  };

  // Handler for selecting the current active mention
  const handleSelectActiveItem = () => {
    if (mentionSuggestions.length === 0) return;
    handleSelectMention(mentionSuggestions[activeMentionIndex]);
  };

  // Handler for selecting a mention suggestion
  const handleSelectMention = (user) => {
    const currentMessage = newMessage;
    const inputElement = document.querySelector('.chat-input-wrapper input');
    if (!inputElement) return;
    
    const cursorPos = inputElement.selectionStart;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterCursor = currentMessage.substring(cursorPos);
      const mentionText = `@${user.name} `;
      const newMessageValue = currentMessage.substring(0, lastAtIndex) + mentionText + textAfterCursor;

      setNewMessage(newMessageValue);
      setShowMentionSuggestions(false);
      setMentionQuery('');

      // Focus input and set cursor position after the mention
      if (inputElement) {
        inputElement.focus();
        // Use setTimeout to ensure the cursor position is set after the state update renders
        setTimeout(() => {
          const newCursorPos = lastAtIndex + mentionText.length;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  // Return all state and handlers needed by the component
  return {
    workspace, loading, error, searchQuery, channels: filteredChannels, // Use filteredChannels for display
    showChannels, canalsLoading, canalsError, showMembers, showOnlineMembers,
    showOfflineMembers, showFiles, showImages, loadingMembers, membersError,
    members, files, images, showCreateChannelModal, newChannel, isCreatingChannel,
    channelError, contextMenu, showEditChannelModal, editingChannel, isUpdatingChannel,
    updateChannelError, activeChannel, messages, newMessage, loadingMessages,
    chatContainerRef, socket, currentUserId, currentUserName, messageContextMenu, showEmojiPicker,
    replyingTo, commonEmojis, isMistralTyping, // Return the typing state
    // Mention state and handlers
    showMentionSuggestions, mentionSuggestions, activeMentionIndex,
    // Handlers
    handleSearchChange, toggleChannelsVisibility, handleChannelInputChange,
    handleCreateChannel, handleCloseModal, handleSubmitChannel, handleChannelContextMenu,
    handleCloseContextMenu, handleEditChannel, handleSubmitEditChannel, handleDeleteChannel,
    handleSelectChannel, handleSendMessage, formatMessageDate, handleMessageContextMenu,
    handleCloseMessageContextMenu, handleReplyMessage, handleShowEmojiPicker,
    handleAddReaction, handleCancelReply, toggleMembers, toggleOnlineMembers,
    toggleOfflineMembers, toggleFiles, toggleImages, setNewChannel, setEditingChannel,
    setShowEditChannelModal, setShowEmojiPicker, setNewMessage, getEmojiForType, // Export helper if needed in component
    handleDeleteMessage, // Add the new handler
    // New handlers for mentions
    handleNewMessageChange, handleSelectMention, handleMentionNavigation, handleSelectActiveItem,
  };
};

// Helper function moved outside the hook for potential reuse or testing
const formatMessageDate = (dateString) => {
  if (!dateString) {
    console.warn('formatMessageDate: date invalide', dateString);
    return '';
  }
  try {
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) {
      console.warn('formatMessageDate: date invalide', dateString);
      return '';
    }
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return '';
  }
};

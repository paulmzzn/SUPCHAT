import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { FaSearch, FaPlus, FaHashtag, FaLock, FaChevronDown, FaChevronRight, FaUserCircle, FaFile, FaImage, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaGlobe, FaCrown, FaUserShield, FaUser, FaEdit, FaTrashAlt } from 'react-icons/fa';
import './WorkspaceDetails.css';
import { API_URL } from '../../config/config';

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
                        className="channel-item"
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
        
        {/* Main Content Area */}
        <div className="workspace-content-area">
          <div className="glow-circle-right top-right"></div>
          <div className="glow-circle-left bottom-left"></div>
          
          <div className="workspace-welcome">
            <h1>Bienvenue sur {workspace?.name}</h1>
            <p>Sélectionnez un canal pour commencer à discuter</p>
          </div>
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
      </div>
    </div>
  );
}

export default WorkspaceDetails;

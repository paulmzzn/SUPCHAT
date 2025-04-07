import React, { useState, useEffect } from 'react';
import { FaUser, FaBell, FaLock, FaPalette, FaLanguage, FaShieldAlt, FaSignOutAlt, FaSave } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Settings.css';
import { API_URL } from '../../config/config';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    status: '', // Déjà défini comme 'online' par défaut
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  // Nouvel état pour suivre si des modifications ont été effectuées
  const [hasChanges, setHasChanges] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    messages: true,
    mentions: true,
    sounds: true,
    email: false,
    desktop: true
  });
  
  // Appearance settings
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('fr');

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    onlineStatus: 'all',
    readReceipts: true,
    messageRequests: 'all'
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        
        // Vérifier que le statut est valide, sinon utiliser 'online' comme défaut
        const validStatuses = ['online', 'away', 'dnd', 'invisible'];
        const defaultStatus = 'online';
        const userStatus = validStatuses.includes(data.status) ? data.status : defaultStatus;
        
        setUserData(data);
        setFormData({
          name: data.nom || '',
          email: data.email || '',
          bio: data.bio || '',
          status: userStatus // Utiliser le statut validé
        });
        
        if (data.photo_url) {
          setAvatarPreview(data.photo_url);
        }
        
        // You could also fetch actual settings from the API here
      } catch (err) {
        // En cas d'erreur, s'assurer que le statut par défaut est 'online'
        setFormData(prevState => ({
          ...prevState,
          status: 'online'
        }));
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setHasChanges(true);
  };

  const handleNotificationChange = (setting) => {
    setNotifications({
      ...notifications,
      [setting]: !notifications[setting]
    });
    setHasChanges(true);
  };

  const handlePrivacyChange = (setting, value) => {
    setPrivacy({
      ...privacy,
      [setting]: value
    });
    setHasChanges(true);
  };

  // Fonction pour réinitialiser l'état des modifications après sauvegarde
  const resetChangesState = () => {
    setHasChanges(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('nom', formData.name);
      formDataToSend.append('bio', formData.bio);
      
      // Convertir le statut en identifiant numérique correspondant
      const statusMap = {
        'online': 1,    // En ligne
        'away': 2,      // Absent
        'dnd': 3,       // Ne pas déranger
        'invisible': 4  // Invisible
      };

      // Obtenir l'ID du statut ou utiliser 1 (en ligne) par défaut
      const statusId = statusMap[formData.status] || 1;
      console.log('Envoi du statut:', { status: formData.status, statusId });
      formDataToSend.append('fk_statut', statusId);
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      alert('Profile updated successfully');
      resetChangesState();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (settingType) => {
    // Simuler la sauvegarde des paramètres
    console.log(`Saving ${settingType} settings:`, 
      settingType === 'notifications' ? notifications :
      settingType === 'privacy' ? privacy :
      settingType === 'appearance' ? { theme, fontSize, language } :
      null
    );
    alert(`${settingType} settings saved!`);
    resetChangesState();
  };

  // Fonction pour gérer l'action du bouton flottant en fonction de l'onglet actif
  const handleFloatingButtonAction = () => {
    switch (activeTab) {
      case 'profile':
        handleSubmit();
        break;
      case 'notifications':
        handleSaveSettings('notifications');
        break;
      case 'privacy':
        handleSaveSettings('privacy');
        break;
      case 'appearance':
        handleSaveSettings('appearance');
        break;
      case 'language':
        handleSaveSettings('language');
        break;
      default:
        break;
    }
  };

  // Réinitialiser l'état des modifications lors du changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setHasChanges(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleDeleteAccount = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible et toutes vos données seront perdues."
    );

    if (confirmed) {
      // Implement account deletion logic here
      console.log("Account deletion requested");
      alert("Votre compte va être supprimé. Vous allez être déconnecté.");
      // Then log out
      handleLogout();
    }
  };

  if (isLoading && !userData) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="settings-container loading-container">
          <div className="loading-indicator">Chargement des paramètres...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="settings-container">
        <div className="glow-circle-right top-right"></div>
        <div className="glow-circle-left bottom-left"></div>
        
        <div className="settings-header">
          <h1>Paramètres</h1>
          <p>Personnalisez votre expérience SUPCHAT</p>
        </div>

        <div className="settings-layout">
          <div className="settings-sidebar">
            <button 
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`} 
              onClick={() => handleTabChange('profile')}
            >
              <FaUser className="tab-icon" />
              <span>Profil</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} 
              onClick={() => handleTabChange('notifications')}
            >
              <FaBell className="tab-icon" />
              <span>Notifications</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`} 
              onClick={() => handleTabChange('privacy')}
            >
              <FaLock className="tab-icon" />
              <span>Confidentialité</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} 
              onClick={() => handleTabChange('appearance')}
            >
              <FaPalette className="tab-icon" />
              <span>Apparence</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'language' ? 'active' : ''}`} 
              onClick={() => handleTabChange('language')}
            >
              <FaLanguage className="tab-icon" />
              <span>Langue</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} 
              onClick={() => handleTabChange('security')}
            >
              <FaShieldAlt className="tab-icon" />
              <span>Sécurité</span>
            </button>
            <button 
              className={`settings-tab danger ${activeTab === 'logout' ? 'active' : ''}`} 
              onClick={handleLogout}
            >
              <FaSignOutAlt className="tab-icon" />
              <span>Déconnexion</span>
            </button>
          </div>

          <div className="settings-content">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2>Mon Profil</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="settings-form">
                  {/* Avatar et présentation */}
                  <div className="profile-header">
                    <div className="avatar-upload">
                      <div className="avatar-preview">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" />
                        ) : (
                          <div className="avatar-placeholder">
                            {formData.name ? formData.name[0].toUpperCase() : '?'}
                          </div>
                        )}
                        <div className="avatar-overlay">
                          <label htmlFor="avatar-input" className="change-avatar-btn">
                            Changer
                          </label>
                          <input
                            type="file"
                            id="avatar-input"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="profile-user-info">
                      <h3>{formData.name || 'Votre nom'}</h3>
                      <p className="user-email">{formData.email}</p>
                      
                      {/* Nouveau sélecteur de statut moderne */}
                      <div className="status-selector">
                        <div className="status-dropdown">
                          <div className="current-status">
                            <span className={`status-dot status-${formData.status}`}></span>
                            <span className="status-text">
                              {formData.status === 'online' && 'En ligne'}
                              {formData.status === 'away' && 'Absent'}
                              {formData.status === 'dnd' && 'Ne pas déranger'}
                              {formData.status === 'invisible' && 'Invisible'}
                            </span>
                            <div className="status-options">
                              <div className="status-option" onClick={() => handleInputChange({target: {name: 'status', value: 'online'}})}>
                                <span className="status-dot status-online"></span>
                                <span>En ligne</span>
                              </div>
                              <div className="status-option" onClick={() => handleInputChange({target: {name: 'status', value: 'away'}})}>
                                <span className="status-dot status-away"></span>
                                <span>Absent</span>
                              </div>
                              <div className="status-option" onClick={() => handleInputChange({target: {name: 'status', value: 'dnd'}})}>
                                <span className="status-dot status-dnd"></span>
                                <span>Ne pas déranger</span>
                              </div>
                              <div className="status-option" onClick={() => handleInputChange({target: {name: 'status', value: 'invisible'}})}>
                                <span className="status-dot status-invisible"></span>
                                <span>Invisible</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="settings-separator">
                    <span>Informations personnelles</span>
                  </div>
                  
                  <div className="profile-section">
                    <div className="form-group">
                      <label htmlFor="name">Nom d'affichage</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                      <small>Ce nom sera visible par tous les utilisateurs</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Adresse e-mail</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        readOnly
                        className="form-input readonly"
                      />
                      <small>L'adresse e-mail ne peut pas être modifiée</small>
                    </div>
                  </div>

                  <div className="settings-separator">
                    <span>Personnalisation</span>
                  </div>
                  
                  <div className="profile-section">
                    <div className="form-group">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="form-textarea"
                        placeholder="Partagez quelque chose à propos de vous..."
                      />
                      <small>Maximum 200 caractères</small>
                    </div>
                  </div>

                  {/* Suppression de la section Préférences qui contenait le statut */}
                </form>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Paramètres de notification</h2>
                
                <div className="settings-group">
                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Notifications de messages</h3>
                      <p>Recevez des notifications lorsque vous recevez des messages</p>
                    </div>
                    <div className="setting-control">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.messages} 
                          onChange={() => handleNotificationChange('messages')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Notifications de mentions</h3>
                      <p>Recevez des notifications lorsque vous êtes mentionné</p>
                    </div>
                    <div className="setting-control">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.mentions} 
                          onChange={() => handleNotificationChange('mentions')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Sons de notification</h3>
                      <p>Jouer un son lorsque vous recevez une notification</p>
                    </div>
                    <div className="setting-control">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.sounds} 
                          onChange={() => handleNotificationChange('sounds')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Notifications par e-mail</h3>
                      <p>Recevez des notifications par e-mail lorsque vous êtes hors ligne</p>
                    </div>
                    <div className="setting-control">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.email} 
                          onChange={() => handleNotificationChange('email')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Notifications sur ordinateur</h3>
                      <p>Afficher les notifications sur votre bureau</p>
                    </div>
                    <div className="setting-control">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={notifications.desktop} 
                          onChange={() => handleNotificationChange('desktop')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Suppression du bouton d'enregistrement statique */}
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2>Paramètres de confidentialité</h2>
                
                <div className="settings-group">
                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Qui peut voir mon statut en ligne</h3>
                    </div>
                    <div className="setting-control">
                      <select 
                        className="form-select" 
                        value={privacy.onlineStatus}
                        onChange={(e) => handlePrivacyChange('onlineStatus', e.target.value)}
                      >
                        <option value="all">Tout le monde</option>
                        <option value="friends">Seulement mes amis</option>
                        <option value="none">Personne</option>
                      </select>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Accusés de lecture</h3>
                      <p>Permettre aux autres de savoir quand vous avez lu leurs messages</p>
                    </div>
                    <div className="setting-control">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={privacy.readReceipts} 
                          onChange={() => handlePrivacyChange('readReceipts', !privacy.readReceipts)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Qui peut m'envoyer des demandes de messages</h3>
                    </div>
                    <div className="setting-control">
                      <select 
                        className="form-select"
                        value={privacy.messageRequests}
                        onChange={(e) => handlePrivacyChange('messageRequests', e.target.value)}
                      >
                        <option value="all">Tout le monde</option>
                        <option value="friends">Seulement mes amis</option>
                        <option value="none">Personne</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Suppression du bouton d'enregistrement statique */}
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="settings-section">
                <h2>Paramètres d'apparence</h2>
                
                <div className="settings-group">
                  <div className="theme-selector">
                    <h3>Thème</h3>
                    <div className="theme-options">
                      <div 
                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="theme-preview dark-theme"></div>
                        <span>Sombre</span>
                      </div>
                      <div 
                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="theme-preview light-theme"></div>
                        <span>Clair</span>
                      </div>
                      <div 
                        className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => setTheme('system')}
                      >
                        <div className="theme-preview system-theme"></div>
                        <span>Système</span>
                      </div>
                    </div>
                  </div>

                  <div className="font-size-selector">
                    <h3>Taille du texte</h3>
                    <div className="font-options">
                      <button 
                        className={`font-option ${fontSize === 'small' ? 'active' : ''}`}
                        onClick={() => setFontSize('small')}
                      >
                        Petit
                      </button>
                      <button 
                        className={`font-option ${fontSize === 'medium' ? 'active' : ''}`}
                        onClick={() => setFontSize('medium')}
                      >
                        Moyen
                      </button>
                      <button 
                        className={`font-option ${fontSize === 'large' ? 'active' : ''}`}
                        onClick={() => setFontSize('large')}
                      >
                        Grand
                      </button>
                    </div>
                  </div>
                </div>

                {/* Suppression du bouton d'enregistrement statique */}
              </div>
            )}

            {/* Language Settings */}
            {activeTab === 'language' && (
              <div className="settings-section">
                <h2>Paramètres de langue</h2>
                
                <div className="settings-group">
                  <div className="settings-item">
                    <div className="setting-info">
                      <h3>Langue de l'application</h3>
                    </div>
                    <div className="setting-control">
                      <select 
                        className="form-select" 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                        <option value="it">Italiano</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Suppression du bouton d'enregistrement statique */}
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Paramètres de sécurité</h2>
                
                <div className="settings-group">
                  <div className="security-option">
                    <h3>Changer de mot de passe</h3>
                    <p>Mettez à jour votre mot de passe pour sécuriser votre compte</p>
                    <button className="btn-secondary">Changer de mot de passe</button>
                  </div>

                  <div className="security-option">
                    <h3>Authentification à deux facteurs</h3>
                    <p>Ajoutez une couche de protection supplémentaire à votre compte</p>
                    <button className="btn-secondary">Configurer l'A2F</button>
                  </div>

                  <div className="security-option">
                    <h3>Sessions actives</h3>
                    <p>Gérez les appareils connectés à votre compte</p>
                    <button className="btn-secondary">Voir les sessions</button>
                  </div>

                  <div className="security-option danger-zone">
                    <h3>Supprimer mon compte</h3>
                    <p>Cette action est irréversible et supprimera toutes vos données</p>
                    <button className="btn-danger" onClick={handleDeleteAccount}>
                      Supprimer mon compte
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton d'enregistrement flottant */}
        {hasChanges && activeTab !== 'security' && (
          <div className="floating-save-button">
            <button 
              className="btn-floating" 
              onClick={handleFloatingButtonAction}
              disabled={isLoading}
            >
              <FaSave className="floating-icon" />
              <span>
                {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

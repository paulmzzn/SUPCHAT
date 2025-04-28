import { useState, useEffect, useCallback, useRef } from "react";
import { FaSearch, FaHeart, FaCamera, FaImage, FaTimes } from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import WorkspaceCard from "./WorkspaceCard";
import { useNavigate } from "react-router-dom";
import "./Workspaces.css";
import { API_URL } from "../../config/config";

function Workspaces() {
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: "",
    isPrivate: false,
    bannerFile: null,
    bannerPreview: null,
    iconFile: null,
    iconPreview: null
  });

  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const navigate = useNavigate();

  const checkTokenValidity = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("Pas de token trouvé");
      return false;
    }

    try {
      console.log("Vérification du token:", token.substring(0, 15) + "...");
      const response = await fetch(`${API_URL}/api/users/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Token invalide ou expiré');
        localStorage.removeItem('token');
        return false;
      }

      const data = await response.json();
      console.log("Token valide, expiration dans:", data.expires_in);
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const verifyAndRedirectIfNeeded = async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        navigate('/login');
      }
    };

    verifyAndRedirectIfNeeded();
  }, [checkTokenValidity, navigate]);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error("Vous devez être connecté pour voir vos favoris");
      }

      const response = await fetch(`${API_URL}/api/workspaces/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Erreur lors de la récupération des favoris:", response.status);
        return [];
      }

      const data = await response.json();
      console.log("Favoris récupérés:", data);

      const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";

      return data.map((workspace) => ({
        id: workspace.id_workspace,
        name: workspace.nom,
        description: workspace.description || "No description available",
        banner: workspace.banner_url && !workspace.banner_url.startsWith('http')
          ? S3_BASE_URL + workspace.banner_url
          : (workspace.banner_url || "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80"),
        icon: workspace.icon_url && !workspace.icon_url.startsWith('http')
          ? S3_BASE_URL + workspace.icon_url
          : (workspace.icon_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80"),
        onlineUsers: workspace.online_users || 0,
        totalMembers: workspace.total_members || 0,
        isFavorite: true,
        isPrivate: workspace.is_private || false,
        userRole: workspace.user_role || "member",
        date_ajout_favoris: workspace.date_ajout_favoris
      }));
    } catch (err) {
      console.error("Error fetching favorite workspaces:", err);
      return [];
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error("Vous devez être connecté pour voir vos workspaces");
      }

      const response = await fetch(`${API_URL}/api/workspaces/user/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workspaces: ${response.status}`);
      }

      const data = await response.json();

      const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";

      const transformedWorkspaces = data.map((workspace) => ({
        id: workspace.id_workspace,
        name: workspace.nom,
        description: workspace.description || "No description available",
        banner: workspace.banner_url ? S3_BASE_URL + workspace.banner_url : "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        icon: workspace.icon_url ? S3_BASE_URL + workspace.icon_url : "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        onlineUsers: workspace.online_users || 0,
        totalMembers: workspace.total_members || 0,
        isFavorite: false,
        isPrivate: workspace.is_private || false,
        userRole: workspace.user_role || "member",
      }));

      const favorites = await fetchFavorites();

      const workspacesWithFavorites = transformedWorkspaces.map(workspace => {
        const isFavorite = favorites.some(f => f.id === workspace.id);
        return { ...workspace, isFavorite };
      });

      setRecentWorkspaces(workspacesWithFavorites);
      setFavoriteWorkspaces(favorites);

    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFavorites]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkspaces(recentWorkspaces);
      return;
    }

    const filtered = recentWorkspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workspace.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, recentWorkspaces]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddWorkspace = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewWorkspace({ name: "", description: "", isPrivate: false, bannerFile: null, bannerPreview: null, iconFile: null, iconPreview: null });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewWorkspace({
      ...newWorkspace,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'banner') {
        setNewWorkspace(prev => ({
          ...prev,
          bannerFile: file,
          bannerPreview: reader.result
        }));
      } else if (type === 'icon') {
        setNewWorkspace(prev => ({
          ...prev,
          iconFile: file,
          iconPreview: reader.result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type) => {
    if (type === 'banner') {
      setNewWorkspace(prev => ({
        ...prev,
        bannerFile: null,
        bannerPreview: null
      }));
    } else if (type === 'icon') {
      setNewWorkspace(prev => ({
        ...prev,
        iconFile: null,
        iconPreview: null
      }));
    }
  };

  const triggerFileInput = (type) => {
    if (type === 'banner' && bannerInputRef.current) {
      bannerInputRef.current.click();
    } else if (type === 'icon' && iconInputRef.current) {
      iconInputRef.current.click();
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error("Vous devez être connecté pour créer un workspace");
      }

      const workspaceData = {
        nom: newWorkspace.name,
        description: newWorkspace.description || "",
        is_private: newWorkspace.isPrivate
      };

      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(workspaceData)
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const createdWorkspace = await response.json();
      const workspaceId = createdWorkspace.id_workspace;

      if (newWorkspace.bannerFile || newWorkspace.iconFile) {
        const formData = new FormData();

        if (newWorkspace.bannerFile) {
          formData.append('banner', newWorkspace.bannerFile);
        }

        if (newWorkspace.iconFile) {
          formData.append('icon', newWorkspace.iconFile);
        }

        const imageResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}/images`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`  // Ajout du token d'autorisation
          },
          body: formData
        });

        if (!imageResponse.ok) {
          console.warn("Workspace created successfully, but images couldn't be saved");
        }
      }

      // Fermer le modal et nettoyer le formulaire
      handleCloseModal();
      
      // Rediriger l'utilisateur vers le workspace nouvellement créé
      navigate(`/workspace/${workspaceId}`);
    } catch (err) {
      console.error("Error creating workspace:", err);
      setError(err.message);
    }
  };

  const handleLeaveWorkspace = (workspaceId) => {
    console.log(`Workspace ${workspaceId} quitté, rafraîchissement de la liste...`);
    fetchWorkspaces();
  };

  const handleFavoriteToggle = useCallback((updatedWorkspace) => {
    setRecentWorkspaces(prev =>
      prev.map(workspace =>
        workspace.id === updatedWorkspace.id ?
          { ...workspace, isFavorite: updatedWorkspace.isFavorite } :
          workspace
      )
    );

    if (updatedWorkspace.isFavorite) {
      setFavoriteWorkspaces(prev => [...prev, updatedWorkspace]);
    } else {
      setFavoriteWorkspaces(prev =>
        prev.filter(workspace => workspace.id !== updatedWorkspace.id)
      );
    }
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="workspaces-container">
        <div className="glow-circle-right top-right"></div>
        <div className="glow-circle-left bottom-left"></div>

        <div className="workspaces-header">
          <h1 className="workspaces-title">Mes Workspaces</h1>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
              <div className="spinner-circle-inner"></div>
            </div>
          </div>
        ) : error ? (
          <div className="error-state">Error: {error}</div>
        ) : (
          <>
            <div className="favorites-section">
              <div className="section-title">
                <FaHeart className="section-icon heart-icon" />
                <h2>Favorites</h2>
              </div>
              <div className="favorites-container">
                {favoriteWorkspaces.length > 0 ? (
                  favoriteWorkspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="favorite-item"
                      onClick={() => navigate(`/workspace/${workspace.id}`)}
                    >
                      <div
                        className="favorite-icon"
                        style={{ backgroundImage: `url(${workspace.icon})` }}
                      ></div>
                      <span className="favorite-name">{workspace.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="favorite-empty-message">
                    Ajoutez des workspaces à vos favoris
                  </div>
                )}
              </div>
            </div>

            <div className="workspaces-section">
              <h2 className="section-title">All Workspaces</h2>
              <div className="workspaces-grid">
                <div className="workspace-card add-workspace" onClick={handleAddWorkspace}>
                  <div className="add-workspace-content">
                    <div className="plus-icon">+</div>
                    <p>Create New Workspace</p>
                  </div>
                </div>

                {filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    onWorkspaceLeave={handleLeaveWorkspace}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            </div>

            {showCreateModal && (
              <div className="modal-overlay" onClick={handleCloseModal}>
                <div className="modal-content modern" onClick={e => e.stopPropagation()}>
                  <h2>Create New Workspace</h2>

                  <form onSubmit={createWorkspace}>
                    <div className="image-upload-container banner-upload">
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={(e) => handleImageUpload(e, 'banner')}
                        accept="image/*"
                        className="hidden-file-input"
                      />

                      {newWorkspace.bannerPreview ? (
                        <div className="image-preview banner-preview">
                          <img src={newWorkspace.bannerPreview} alt="Banner preview" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage('banner')}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder banner-placeholder" onClick={() => triggerFileInput('banner')}>
                          <FaImage className="upload-icon" />
                          <span>Add Banner Image</span>
                        </div>
                      )}
                    </div>

                    <div className="workspace-identity-row">
                      <div className="icon-upload-container">
                        <input
                          type="file"
                          ref={iconInputRef}
                          onChange={(e) => handleImageUpload(e, 'icon')}
                          accept="image/*"
                          className="hidden-file-input"
                        />

                        {newWorkspace.iconPreview ? (
                          <div className="icon-preview">
                            <img src={newWorkspace.iconPreview} alt="Icon preview" />
                            <button
                              type="button"
                              className="remove-icon-btn"
                              onClick={() => removeImage('icon')}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <div className="icon-placeholder" onClick={() => triggerFileInput('icon')}>
                            <FaCamera />
                          </div>
                        )}
                      </div>

                      <div className="workspace-name-emoji">
                        <div className="form-group name-input">
                          <label htmlFor="name">Workspace Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={newWorkspace.name}
                            onChange={handleInputChange}
                            required
                            placeholder="My Awesome Workspace"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={newWorkspace.description}
                        onChange={handleInputChange}
                        placeholder="What's this workspace about?"
                      ></textarea>
                    </div>

                    <div className="privacy-toggle">
                      <label htmlFor="isPrivate" className="toggle-label">
                        <span className="privacy-label">Privacy</span>
                        <span className="privacy-description">
                          {newWorkspace.isPrivate ?
                            "Private - Only invited members can join" :
                            "Public - Anyone with the link can join"}
                        </span>
                      </label>

                      <label className="switch">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          name="isPrivate"
                          checked={newWorkspace.isPrivate}
                          onChange={handleInputChange}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="modal-actions">
                      <button type="button" onClick={handleCloseModal} className="cancel-btn">
                        Cancel
                      </button>
                      <button type="submit" className="create-btn">
                        Create Workspace
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Workspaces;

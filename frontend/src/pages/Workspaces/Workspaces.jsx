import { useState, useEffect, useCallback, useRef } from "react";
import { FaSearch, FaHeart, FaCamera, FaImage, FaTimes } from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import WorkspaceCard from "./WorkspaceCard";
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

  // Define fetchWorkspaces as a memoized function to avoid recreating it on each render
  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/workspaces`);

      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }

      const data = await response.json();

      // Transform backend data to match frontend format
      const transformedWorkspaces = data.map((workspace) => ({
        id: workspace.id_workspace,
        name: workspace.nom,
        description: workspace.description || "No description available",
        banner:
          workspace.banner_url ||
          "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        icon:
          workspace.icon_url ||
          "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        onlineUsers: workspace.online_users || 0,
        totalMembers: workspace.total_members || 0,
        isFavorite: workspace.is_favorite || false,
        isPrivate: workspace.is_private || false,
      }));

      // Filter for favorites (we'll need to implement proper favorite logic later)
      // For now, let's assume the first 2 are favorites
      const favorites = transformedWorkspaces.slice(0, 2);

      // Recent workspaces - for now, just all of them
      const recent = [...transformedWorkspaces];

      setFavoriteWorkspaces(favorites);
      setRecentWorkspaces(recent);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies, so this function never changes

  // Fetch workspaces only once when component mounts
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]); // Only re-run when fetchWorkspaces changes (which it never will)

  // Filter workspaces based on search query
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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Function to handle adding a new workspace
  const handleAddWorkspace = () => {
    setShowCreateModal(true);
  };

  // Function to handle modal close
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewWorkspace({ name: "", description: "", isPrivate: false, bannerFile: null, bannerPreview: null, iconFile: null, iconPreview: null});
  };

  // Function to handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewWorkspace({
      ...newWorkspace,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Function to handle image uploads
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    // Check if file is too large (5MB max)
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
  
  // Function to remove an uploaded image
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
  
  // Updated function to trigger file inputs
  const triggerFileInput = (type) => {
    if (type === 'banner' && bannerInputRef.current) {
      bannerInputRef.current.click();
    } else if (type === 'icon' && iconInputRef.current) {
      iconInputRef.current.click();
    }
  };
  
  
  // Updated function to create a new workspace
  const createWorkspace = async (e) => {
    e.preventDefault();
    try {
      // First create the workspace with basic data
      const workspaceData = {
        nom: newWorkspace.name,
        description: newWorkspace.description || "",
        is_private: newWorkspace.isPrivate
      };

      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(workspaceData)
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }
      
      const createdWorkspace = await response.json();
      const workspaceId = createdWorkspace.id_workspace;
      
      // If we have images, upload them in a second request
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
          body: formData
        });
        
        if (!imageResponse.ok) {
          console.warn("Workspace created successfully, but images couldn't be saved");
        }
      }

      fetchWorkspaces();
      handleCloseModal();
    } catch (err) {
      console.error("Error creating workspace:", err);
      setError(err.message);
    }
  };

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
            {/* Favorites section */}
            <div className="favorites-section">
              <div className="section-title">
                <FaHeart className="section-icon heart-icon" />
                <h2>Favorites</h2>
              </div>
              <div className="favorites-container">
                {favoriteWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="favorite-item">
                    <div
                      className="favorite-icon"
                      style={{ backgroundImage: `url(${workspace.icon})` }}
                    ></div>
                    <span className="favorite-name">{workspace.name}</span>
                  </div>
                ))}
                {/* Empty placeholder slots for future favorites */}
                {[...Array(3 - favoriteWorkspaces.length)].map((_, i) => (
                  <div key={`empty-${i}`} className="favorite-item empty">
                    <div className="favorite-icon empty"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workspaces grid */}
            <div className="workspaces-section">
              <h2 className="section-title">All Workspaces</h2>
              <div className="workspaces-grid">
                {/* Add workspace button/card - NOW FIRST */}
                <div className="workspace-card add-workspace" onClick={handleAddWorkspace}>
                  <div className="add-workspace-content">
                    <div className="plus-icon">+</div>
                    <p>Create New Workspace</p>
                  </div>
                </div>
                
                {/* Existing workspaces */}
                {filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard key={workspace.id} workspace={workspace} />
                ))}
              </div>
            </div>

            {/* Create Workspace Modal */}
            {showCreateModal && (
              <div className="modal-overlay" onClick={handleCloseModal}>
                <div className="modal-content modern" onClick={e => e.stopPropagation()}>
                  <h2>Create New Workspace</h2>
                  
                  <form onSubmit={createWorkspace}>
                    {/* Banner Image Upload */}
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
                    
                    {/* Icon and Name Row */}
                    <div className="workspace-identity-row">
                      {/* Icon Upload */}
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
                        {/* Workspace Name */}
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
                    
                    {/* Description */}
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
                    
                    {/* Privacy Toggle */}
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
                    
                    {/* Form Actions */}
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

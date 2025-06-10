import { useState, useEffect, useCallback, useRef } from "react";
import { useNotifications } from "../../context/NotificationContext";
import NotificationBadge from "../../components/NotificationBadge/NotificationBadge";
import {
  FaSearch,
  FaHeart,
  FaCamera,
  FaImage,
  FaTimes,
  FaPlus,
  FaPlusCircle,
} from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import WorkspaceCard from "./WorkspaceCard";
import { useNavigate } from "react-router-dom";
import "./Workspaces.css";
import { API_URL } from "../../config/config";

function Workspaces() {
  // Notifications context
  const { unreadCounts } = useNotifications();

  // Agréger les notifications non lues par workspace
  const getWorkspaceUnreadCount = (workspaceId) => {
    if (!unreadCounts || !unreadCounts.channels) return 0;
    return Object.values(unreadCounts.channels).reduce((sum, notif) => {
      if (notif.workspaceId === workspaceId) {
        return sum + (notif.count || 0);
      }
      return sum;
    }, 0);
  };
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
    bannerFile: null,
    bannerPreview: null,
    iconFile: null,
    iconPreview: null,
  });

  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const navigate = useNavigate();

  const checkTokenValidity = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Pas de token trouvé");
      return false;
    }

    try {
      console.log("Vérification du token:", token.substring(0, 15) + "...");
      const response = await fetch(`${API_URL}/api/users/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Token invalide ou expiré");
        localStorage.removeItem("token");
        return false;
      }

      const data = await response.json();
      console.log("Token valide, expiration dans:", data.expires_in);
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification du token:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const verifyAndRedirectIfNeeded = async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        navigate("/login");
      }
    };

    verifyAndRedirectIfNeeded();
  }, [checkTokenValidity, navigate]);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Vous devez être connecté pour voir vos favoris");
      }

      const response = await fetch(`${API_URL}/api/workspaces/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Erreur lors de la récupération des favoris:",
          response.status
        );
        return [];
      }

      const data = await response.json();
      console.log("Favoris récupérés:", data);

      const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";

      return data.map((workspace) => ({
        id: workspace.id_workspace,
        name: workspace.nom,
        description: workspace.description || "No description available",
        banner:
          workspace.banner_url && !workspace.banner_url.startsWith("http")
            ? S3_BASE_URL + workspace.banner_url
            : workspace.banner_url ||
              "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        icon:
          workspace.icon_url && !workspace.icon_url.startsWith("http")
            ? S3_BASE_URL + workspace.icon_url
            : workspace.icon_url ||
              "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        onlineUsers: workspace.online_users || 0,
        totalMembers: workspace.total_members || 0,
        isFavorite: true,
        isPrivate: workspace.is_private || false,
        userRole: workspace.user_role || "member",
        date_ajout_favoris: workspace.date_ajout_favoris,
      }));
    } catch (err) {
      console.error("Error fetching favorite workspaces:", err);
      return [];
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Vous devez être connecté pour voir vos workspaces");
      }

      const response = await fetch(
        `${API_URL}/api/workspaces/user/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch workspaces: ${response.status}`);
      }

      const data = await response.json();

      const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";      const transformedWorkspaces = data.map((workspace) => ({
        id: workspace.id_workspace,
        name: workspace.nom,
        description: workspace.description || "No description available",
        banner: workspace.banner_url
          ? (workspace.banner_url.startsWith('http') ? workspace.banner_url : S3_BASE_URL + workspace.banner_url)
          : "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        icon: workspace.icon_url
          ? (workspace.icon_url.startsWith('http') ? workspace.icon_url : S3_BASE_URL + workspace.icon_url)
          : "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
        onlineUsers: workspace.online_users || 0,
        totalMembers: workspace.total_members || 0,
        isFavorite: false,
        isPrivate: workspace.is_private || false,
        userRole: workspace.user_role || "member",
      }));

      const favorites = await fetchFavorites();

      const workspacesWithFavorites = transformedWorkspaces.map((workspace) => {
        const isFavorite = favorites.some((f) => f.id === workspace.id);
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
    setIsEditMode(false);
    setCurrentWorkspaceId(null);
    setWorkspaceForm({
      name: "",
      description: "",
      isPrivate: false,
      bannerFile: null,
      bannerPreview: null,
      iconFile: null,
      iconPreview: null,
    });
    setShowModal(true);
  };

  const handleEditWorkspace = (workspace) => {
    // Pré-remplir le formulaire avec les données du workspace à modifier
    setIsEditMode(true);
    setCurrentWorkspaceId(workspace.id);
    setWorkspaceForm({
      name: workspace.name,
      description: workspace.description || "",
      isPrivate: workspace.isPrivate || false,
      bannerFile: null,
      bannerPreview: workspace.banner,
      iconFile: null,
      iconPreview: workspace.icon,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setCurrentWorkspaceId(null);
    setWorkspaceForm({
      name: "",
      description: "",
      isPrivate: false,
      bannerFile: null,
      bannerPreview: null,
      iconFile: null,
      iconPreview: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkspaceForm({
      ...workspaceForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (type === "banner") {
        setWorkspaceForm((prev) => ({
          ...prev,
          bannerFile: file,
          bannerPreview: reader.result,
        }));
      } else if (type === "icon") {
        setWorkspaceForm((prev) => ({
          ...prev,
          iconFile: file,
          iconPreview: reader.result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type) => {
    if (type === "banner") {
      setWorkspaceForm((prev) => ({
        ...prev,
        bannerFile: null,
        bannerPreview: null,
      }));
    } else if (type === "icon") {
      setWorkspaceForm((prev) => ({
        ...prev,
        iconFile: null,
        iconPreview: null,
      }));
    }
  };

  const triggerFileInput = (type) => {
    if (type === "banner" && bannerInputRef.current) {
      bannerInputRef.current.click();
    } else if (type === "icon" && iconInputRef.current) {
      iconInputRef.current.click();
    }
  };
  const saveWorkspace = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Vous devez être connecté pour gérer un workspace");
      }

      const workspaceData = {
        nom: workspaceForm.name,
        description: workspaceForm.description || "",
        is_private: workspaceForm.isPrivate,
      };

      // Différentes URLs et méthodes selon le mode (création ou édition)
      const url = isEditMode
        ? `${API_URL}/api/workspaces/${currentWorkspaceId}`
        : `${API_URL}/api/workspaces`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(workspaceData),
      });

      if (!response.ok) {
        throw new Error(
          isEditMode
            ? "Échec de la mise à jour du workspace"
            : "Échec de la création du workspace"
        );
      }

      const responseWorkspace = await response.json();
      const workspaceId = isEditMode
        ? currentWorkspaceId
        : responseWorkspace.id_workspace;

      // Gérer les images si elles ont été modifiées
      if (workspaceForm.bannerFile || workspaceForm.iconFile) {
        const formData = new FormData();

        if (workspaceForm.bannerFile) {
          formData.append("banner", workspaceForm.bannerFile);
        }

        if (workspaceForm.iconFile) {
          formData.append("icon", workspaceForm.iconFile);
        }

        const imageResponse = await fetch(
          `${API_URL}/api/workspaces/${workspaceId}/images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!imageResponse.ok) {
          console.warn(
            "Workspace saved successfully, but images couldn't be updated"
          );
        }
      }

      // Rafraîchir la liste des workspaces
      fetchWorkspaces();

      // Fermer le modal et nettoyer le formulaire
      handleCloseModal();

      // Afficher un message de confirmation
      alert(
        isEditMode
          ? "Workspace mis à jour avec succès !"
          : "Workspace créé avec succès !"
      );

      // Si c'est une création, rediriger vers le workspace
      if (!isEditMode) {
        navigate(`/workspace/${workspaceId}`);
      }
    } catch (err) {
      console.error(
        isEditMode ? "Error updating workspace:" : "Error creating workspace:",
        err
      );
      setError(err.message);
    }
  };

  const handleLeaveWorkspace = (workspaceId) => {
    console.log(
      `Workspace ${workspaceId} quitté, rafraîchissement de la liste...`
    );
    fetchWorkspaces();
  };

  const handleFavoriteToggle = useCallback((updatedWorkspace) => {
    setRecentWorkspaces((prev) =>
      prev.map((workspace) =>
        workspace.id === updatedWorkspace.id
          ? { ...workspace, isFavorite: updatedWorkspace.isFavorite }
          : workspace
      )
    );

    if (updatedWorkspace.isFavorite) {
      setFavoriteWorkspaces((prev) => [...prev, updatedWorkspace]);
    } else {
      setFavoriteWorkspaces((prev) =>
        prev.filter((workspace) => workspace.id !== updatedWorkspace.id)
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
          {" "}
          <h1 className="workspaces-title">Mes espaces de travail</h1>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher des espaces de travail..."
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
              {" "}
              <div className="section-title">
                <FaHeart className="section-icon heart-icon" />
                <h2>Favoris</h2>
              </div>
              <div className="favorites-container">
                {favoriteWorkspaces.length > 0 ? (
                  favoriteWorkspaces.map((workspace) => {
                    const unread = getWorkspaceUnreadCount(workspace.id);
                    return (
                      <div
                        key={workspace.id}
                        className="favorite-item"
                        onClick={() => navigate(`/workspace/${workspace.id}`)}
                        style={{ position: "relative" }}
                      >
                        <div
                          className="favorite-icon"
                          style={{ backgroundImage: `url(${workspace.icon})` }}
                        >
                          {unread > 0 && (
                            <NotificationBadge count={unread} className="workspace-badge" />
                          )}
                        </div>
                        <span className="favorite-name">
                          {workspace.name}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="favorite-empty-message">
                    Ajoutez des workspaces à vos favoris
                  </div>
                )}
              </div>
            </div>{" "}
            <div className="workspaces-section">
              <h2 className="section-title">Tous les espaces de travail</h2>
              <div className="workspaces-grid">
                {" "}
                <div
                  className="workspace-card add-workspace"
                  onClick={handleAddWorkspace}
                >
                  {" "}
                  <div className="add-workspace-content">
                    <FaPlusCircle className="plus-icon" aria-hidden="true" />
                    <p>Créer un espace de travail</p>
                    <span>Commencez à collaborer avec votre équipe</span>
                  </div>
                </div>{" "}
                {filteredWorkspaces.map((workspace) => {
                  const unread = getWorkspaceUnreadCount(workspace.id);
                  return (
                    <WorkspaceCard
                      key={workspace.id}
                      workspace={{ ...workspace, unreadNotifications: unread }}
                      onWorkspaceLeave={handleLeaveWorkspace}
                      onFavoriteToggle={handleFavoriteToggle}
                      onEditWorkspace={handleEditWorkspace}
                    />
                  );
                })}
              </div>
            </div>{" "}
            {showModal && (
              <div className="modal-overlay" onClick={handleCloseModal}>
                <div
                  className="modal-content modern"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2>
                    {isEditMode
                      ? "Modifier le Workspace"
                      : "Créer un Workspace"}
                  </h2>

                  <form onSubmit={saveWorkspace}>
                    <div className="image-upload-container banner-upload">
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={(e) => handleImageUpload(e, "banner")}
                        accept="image/*"
                        className="hidden-file-input"
                      />{" "}
                      {workspaceForm.bannerPreview ? (
                        <div className="image-preview banner-preview">
                          <img
                            src={workspaceForm.bannerPreview}
                            alt="Banner preview"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage("banner")}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="upload-placeholder banner-placeholder"
                          onClick={() => triggerFileInput("banner")}
                        >
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
                          onChange={(e) => handleImageUpload(e, "icon")}
                          accept="image/*"
                          className="hidden-file-input"
                        />{" "}
                        {workspaceForm.iconPreview ? (
                          <div className="icon-preview">
                            <img
                              src={workspaceForm.iconPreview}
                              alt="Icon preview"
                            />
                            <button
                              type="button"
                              className="remove-icon-btn"
                              onClick={() => removeImage("icon")}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="icon-placeholder"
                            onClick={() => triggerFileInput("icon")}
                          >
                            <FaCamera />
                          </div>
                        )}
                      </div>

                      <div className="workspace-name-emoji">
                        {" "}
                        <div className="form-group name-input">
                          <label htmlFor="name">
                            Nom de l'espace de travail
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={workspaceForm.name}
                            onChange={handleInputChange}
                            required
                            placeholder="Mon super espace de travail"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Description</label>{" "}
                      <textarea
                        id="description"
                        name="description"
                        value={workspaceForm.description}
                        onChange={handleInputChange}
                        placeholder="À propos de cet espace de travail"
                      ></textarea>
                    </div>

                    <div className="privacy-toggle">
                      {" "}
                      <label htmlFor="isPrivate" className="toggle-label">
                        <span className="privacy-label">Confidentialité</span>
                        <span className="privacy-description">
                          {" "}
                          {workspaceForm.isPrivate
                            ? "Privé - Seuls les membres invités peuvent rejoindre"
                            : "Public - Tout le monde avec le lien peut rejoindre"}
                        </span>
                      </label>
                      <label className="switch">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          name="isPrivate"
                          checked={workspaceForm.isPrivate}
                          onChange={handleInputChange}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="modal-actions">
                      {" "}
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="cancel-btn"
                      >
                        Annuler
                      </button>{" "}
                      <button type="submit" className="create-btn">
                        {isEditMode
                          ? "Enregistrer les modifications"
                          : "Créer l'espace de travail"}
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

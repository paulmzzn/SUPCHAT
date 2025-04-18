import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import WorkspaceCard from "../Workspaces/WorkspaceCard";
import defaultBanner from "../../assets/images/baniere_default.png";
import "./Discover.css";
import { API_URL } from "../../config/config";

function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  const [processedWorkspaces, setProcessedWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [userWorkspaceIds, setUserWorkspaceIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's workspace IDs
  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserWorkspaceIds([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/workspaces/user/workspaces`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const ids = data.map((ws) => ws.id_workspace);
          setUserWorkspaceIds(ids);
        } else {
          console.error(
            "Failed to fetch user workspaces, status:",
            response.status
          );
          setUserWorkspaceIds([]);
        }
      } catch (err) {
        console.error("Error fetching user workspaces:", err);
        setUserWorkspaceIds([]);
      }
    };

    fetchUserWorkspaces();
  }, []);

  // Fetch all workspaces
  useEffect(() => {
    const fetchAllWorkspaces = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/workspaces`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch workspaces (status: ${response.status})`
          );
        }

        const data = await response.json();
        setAllWorkspaces(data);
      } catch (err) {
        console.error("Error fetching all workspaces:", err);
        setError(err.message);
        setAllWorkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllWorkspaces();
  }, []);

  // Process workspaces (add hasJoined) when allWorkspaces or userWorkspaceIds change
  useEffect(() => {
    const processed = allWorkspaces.map((workspace) => ({
      id: workspace.id_workspace,
      name: workspace.nom,
      description: workspace.description || "No description available",
      banner: workspace.banner_url || defaultBanner,
      icon:
        workspace.icon_url ||
        "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
      onlineUsers: workspace.online_users || 0,
      totalMembers: workspace.total_members || 0,
      isFavorite: workspace.is_favorite || false,
      isPrivate: workspace.is_private || false,
      hasJoined: userWorkspaceIds.includes(workspace.id_workspace),
    }));
    setProcessedWorkspaces(processed);
  }, [allWorkspaces, userWorkspaceIds]);

  // Filter workspaces based on search query and processed data
  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkspaces(processedWorkspaces);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = processedWorkspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(lowerCaseQuery) ||
        (workspace.description &&
          workspace.description.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, processedWorkspaces]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="discover-container">
        <div className="glow-circle-right top-right"></div>
        <div className="glow-circle-left bottom-left"></div>

        <div className="discover-header">
          <h1 className="discover-title">Découvrir</h1>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher des workspaces..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="workspaces-section">
          <h2 className="section-title">Tous les Workspaces</h2>

          {isLoading ? (
            <div className="loading-state">Chargement des workspaces...</div>
          ) : error ? (
            <div className="error-state">Erreur: {error}</div>
          ) : (
            <div className="workspaces-grid">
              {filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    showJoinButton={true}
                    hasJoined={workspace.hasJoined}
                  />
                ))
              ) : (
                <div className="no-results">
                  {searchQuery
                    ? "Aucun workspace ne correspond à votre recherche."
                    : "Aucun workspace public trouvé."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Discover;

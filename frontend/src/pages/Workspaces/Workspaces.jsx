import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaHeart } from "react-icons/fa";
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
          <div className="loading-state">Loading workspaces...</div>
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
                {filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard key={workspace.id} workspace={workspace} />
                ))}
                {/* Add workspace button/card */}
                <div className="workspace-card add-workspace">
                  <div className="add-workspace-content">
                    <div className="plus-icon">+</div>
                    <p>Create New Workspace</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Workspaces;

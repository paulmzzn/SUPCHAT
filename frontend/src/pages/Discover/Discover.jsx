import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar/Sidebar';
import WorkspaceCard from '../Workspaces/WorkspaceCard';
import defaultBanner from '../../assets/images/baniere_default.png';
import './Discover.css';

function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch workspaces from backend API - only run once on component mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/api/workspaces');
        
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        
        const data = await response.json();
        
        // Transform backend data to match frontend format
        const transformedWorkspaces = data.map(workspace => ({
          id: workspace.id_workspace,
          name: workspace.nom,
          description: workspace.description || "No description available",
          banner: workspace.banner_url || defaultBanner,
          icon: workspace.icon_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80",
          onlineUsers: workspace.online_users || 0,
          totalMembers: workspace.total_members || 0,
          isFavorite: workspace.is_favorite || false,
          isPrivate: workspace.is_private || false
        }));
        
        setWorkspaces(transformedWorkspaces);
        // Don't set filtered workspaces here - we'll do it in the next useEffect
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []); // Empty dependency array means this runs once on mount

  // Filter workspaces based on search query and when workspaces change
  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkspaces(workspaces);
      return;
    }
    
    const filtered = workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (workspace.description && workspace.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, workspaces]); // Only re-run when searchQuery or workspaces change

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
              placeholder="Search workspaces..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Workspaces grid */}
        <div className="workspaces-section">
          <h2 className="section-title">All Workspaces</h2>
          
          {isLoading ? (
            <div className="loading-state">Loading workspaces...</div>
          ) : error ? (
            <div className="error-state">Error: {error}</div>
          ) : (
            <div className="workspaces-grid">
              {filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map(workspace => (
                  <WorkspaceCard key={workspace.id} workspace={workspace} />
                ))
              ) : (
                <div className="no-results">No workspaces found matching your search.</div>
              )}
              
              {/* Add workspace button/card */}
              <div className="workspace-card add-workspace">
                <div className="add-workspace-content">
                  <div className="plus-icon">+</div>
                  <p>Create New Workspace</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Discover;

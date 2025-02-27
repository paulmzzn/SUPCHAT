import { useState, useEffect } from 'react';
import { FaSearch, FaHeart } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar/Sidebar';
import WorkspaceCard from './WorkspaceCard';
import './Workspaces.css';

function Workspaces() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  
  // Sample workspace data (would typically come from an API)
  const workspaces = [
    {
      id: 1,
      name: "Design Team",
      emoji: "🎨",
      description: "For all design related projects and discussions",
      banner: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80",
      icon: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80",
      onlineUsers: 5,
      totalMembers: 12,
      isFavorite: true
    },
    {
      id: 2,
      name: "Development",
      emoji: "👨‍💻",
      description: "Frontend and backend discussions for our projects",
      banner: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
      icon: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80",
      onlineUsers: 8,
      totalMembers: 15,
      isFavorite: false
    },
    {
      id: 3,
      name: "Marketing",
      emoji: "📊",
      description: "Campaign planning and analytics for our products",
      banner: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2426&q=80",
      icon: "https://images.unsplash.com/photo-1611162617263-4ec3060a058e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80",
      onlineUsers: 3,
      totalMembers: 8,
      isFavorite: true
    }
  ];

  // Filter workspaces based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkspaces(workspaces);
      return;
    }
    
    const filtered = workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      workspace.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, workspaces]);

  // Get favorite workspaces
  const favoriteWorkspaces = workspaces.filter(workspace => workspace.isFavorite);

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
          <h1 className="workspaces-title">Workspaces</h1>
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
        
        {/* Favorites section */}
        <div className="favorites-section">
          <div className="section-title">
            <FaHeart className="section-icon heart-icon" />
            <h2>Favorites</h2>
          </div>
          <div className="favorites-container">
            {favoriteWorkspaces.map(workspace => (
              <div key={workspace.id} className="favorite-item">
                <div className="favorite-icon" style={{ backgroundImage: `url(${workspace.icon})` }}></div>
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
            {filteredWorkspaces.map(workspace => (
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
      </div>
    </div>
  );
}

export default Workspaces;

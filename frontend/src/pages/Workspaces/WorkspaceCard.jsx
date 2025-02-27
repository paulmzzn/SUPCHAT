import { useState } from 'react';
import { FaEllipsisH, FaUsers, FaCircle } from 'react-icons/fa';
import './WorkspaceCard.css';

function WorkspaceCard({ workspace }) {
  const [showOptions, setShowOptions] = useState(false);
  
  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };
  
  const handleCardClick = () => {
    // Navigate to workspace detail page or open workspace
    console.log(`Opening workspace: ${workspace.name}`);
  };

  return (
    <div className="workspace-card" onClick={handleCardClick}>
      <div 
        className="workspace-banner"
        style={{ backgroundImage: `url(${workspace.banner})` }}
      >
        <div 
          className="workspace-icon"
          style={{ backgroundImage: `url(${workspace.icon})` }}
        ></div>
        <button className="options-button" onClick={toggleOptions}>
          <FaEllipsisH />
        </button>
        
        {/* Options dropdown */}
        {showOptions && (
          <div className="options-dropdown">
            <ul>
              <li>Edit</li>
              <li>Share</li>
              <li className="danger">Delete</li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="workspace-details">
        <div className="workspace-name">
          <span className="workspace-emoji">{workspace.emoji}</span>
          {workspace.name}
        </div>
        <p className="workspace-description">{workspace.description}</p>
        <div className="workspace-stats">
          <div className="online-users">
            <FaCircle className="online-indicator" />
            <span>{workspace.onlineUsers} online</span>
          </div>
          <div className="total-members">
            <FaUsers className="members-icon" />
            <span>{workspace.totalMembers} members</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceCard;

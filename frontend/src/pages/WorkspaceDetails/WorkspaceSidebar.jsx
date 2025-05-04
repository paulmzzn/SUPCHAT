import React from "react";
import { FaSearch, FaPlus, FaHashtag, FaLock, FaChevronDown, FaChevronRight } from "react-icons/fa";
import "../WorkspaceDetails/WorkspaceDetails.css";
import ChannelList from "./ChannelList";

function WorkspaceSidebar({
  workspace,
  searchQuery,
  handleSearchChange,
  showChannels,
  toggleChannelsVisibility,
  channels,
  canalsLoading,
  canalsError,
  activeChannel,
  handleSelectChannel,
  handleChannelContextMenu,
  currentUserRole,
  handleCreateChannel,
}) {
  return (
    <div className="workspace-sidebar">
      <div className="workspace-sidebar-header">
        <div className="workspace-profile">
          {workspace && (
            <>
              <div
                className="workspace-avatar"
                style={{ backgroundImage: `url(${workspace.icon})` }}
              ></div>
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
            {showChannels ? (
              <FaChevronDown className="toggle-icon" />
            ) : (
              <FaChevronRight className="toggle-icon" />
            )}
            <h3>Canaux</h3>
            {(currentUserRole === "owner" || currentUserRole === "admin") && (
              <button className="add-channel-btn" onClick={handleCreateChannel}>
                <FaPlus />
              </button>
            )}
          </div>
          {showChannels && (
            <ChannelList
              channels={channels}
              canalsLoading={canalsLoading}
              canalsError={canalsError}
              activeChannel={activeChannel}
              handleSelectChannel={handleSelectChannel}
              handleChannelContextMenu={handleChannelContextMenu}
              currentUserRole={currentUserRole}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceSidebar;

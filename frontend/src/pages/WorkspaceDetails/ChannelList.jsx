import React from "react";
import { FaHashtag, FaLock, FaEye, FaEdit } from "react-icons/fa";
import NotificationBadge from "../../components/NotificationBadge/NotificationBadge";
import { useNotifications } from "../../context/NotificationContext";

function ChannelList({
  channels,
  canalsLoading,
  canalsError,
  activeChannel,
  handleSelectChannel,
  handleChannelContextMenu,
  currentUserRole,
  searchQuery, // Pour filtrer les canaux si besoin
  currentUserId
}) {
  // Use the notification context for unread counts
  const { unreadCounts } = useNotifications();

  if (canalsLoading) {
    return <ul className="channels-list"><li className="channel-loading">Chargement des canaux...</li></ul>;
  }
  if (canalsError) {
    return <ul className="channels-list"><li className="channel-error">Erreur: {canalsError}</li></ul>;
  }
  if (!channels.length) {
    return <ul className="channels-list"><li className="no-channels">Aucun canal trouvé</li></ul>;
  }

  // Filtrer les canaux si une recherche est active
  const filteredChannels = searchQuery 
    ? channels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : channels;
    
  if (searchQuery && !filteredChannels.length) {
    return <ul className="channels-list"><li className="no-channels">Aucun canal ne correspond à "{searchQuery}"</li></ul>;
  }

  return (
    <ul className="channels-list">
      {filteredChannels.map((channel) => {
        // Get unread count from the notification context
        const channelUnreadCount = unreadCounts?.channels?.[channel.id]?.count || 0;
        
        // Déterminer le niveau d'accès pour les canaux privés
        const accessLevel = channel.isPrivate ? (channel.memberAccess || "read") : "write";
        const isReadOnly = accessLevel === "read";
          
        return (
          <li
            key={channel.id}
            className={`channel-item ${activeChannel && activeChannel.id === channel.id ? "active" : ""}`}
            onClick={() => handleSelectChannel(channel)}
            onContextMenu={(e) =>
              (currentUserRole === "owner" || currentUserRole === "admin") &&
              handleChannelContextMenu(e, channel)
            }
          >
            {channel.isPrivate ? (
              <FaLock className="channel-icon" />
            ) : (
              <FaHashtag className="channel-icon" />
            )}
            <div className="channel-info-container">
              <span className="channel-name">{channel.name}</span>
              {channel.description && (
                <div className="channel-description">
                  {channel.description.length > 30 
                    ? channel.description.substring(0, 30) + '...' 
                    : channel.description}
                </div>
              )}
            </div>
            
            {/* Indicateur de droits d'accès pour les canaux privés */}
            {channel.isPrivate && (
              <div className={`channel-access-indicator ${isReadOnly ? 'read-only' : 'read-write'}`}
                   title={isReadOnly ? 'Lecture seule' : 'Lecture et écriture'}>
                {isReadOnly ? <FaEye className="access-icon" /> : <FaEdit className="access-icon" />}
              </div>
            )}
            
            {/* Display notification badge if there are unread messages */}
            {channelUnreadCount > 0 && (
              <NotificationBadge count={channelUnreadCount} className="channel-badge" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default ChannelList;

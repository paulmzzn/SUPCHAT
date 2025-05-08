import React from "react";
import { FaHashtag, FaLock } from "react-icons/fa";
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

  return (
    <ul className="channels-list">
      {channels.map((channel) => {
        // Get unread count from the notification context
        const channelUnreadCount = unreadCounts.channels[channel.id]?.count || 0;
          
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
            <span className="channel-name">{channel.name}</span>
            
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

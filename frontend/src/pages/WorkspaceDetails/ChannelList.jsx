import React from "react";
import { FaHashtag, FaLock } from "react-icons/fa";

function ChannelList({
  channels,
  canalsLoading,
  canalsError,
  activeChannel,
  handleSelectChannel,
  handleChannelContextMenu,
  currentUserRole,
}) {
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
      {channels.map((channel) => (
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
        </li>
      ))}
    </ul>
  );
}

export default ChannelList;

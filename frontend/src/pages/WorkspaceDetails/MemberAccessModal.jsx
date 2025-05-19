import React, { useState, useEffect } from "react";
import { FaLock, FaEye, FaEdit, FaTimes } from "react-icons/fa";
import { API_URL } from "../../config/config";
import "./MemberAccessModal.css";

const MemberAccessModal = ({ show, onClose, member, workspaceId }) => {
  const [privateChannels, setPrivateChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessRights, setAccessRights] = useState({});
  const [updatingChannelId, setUpdatingChannelId] = useState(null);

  // Charger tous les canaux privés du workspace
  useEffect(() => {
    if (!show || !workspaceId || !member) return;

    const fetchPrivateChannels = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/canaux/private`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les canaux privés");
        }
        
        const channels = await response.json();
        setPrivateChannels(channels);
        
        // Initialiser les droits d'accès pour chaque canal
        const memberAccessResponse = await fetch(
          `${API_URL}/api/workspaces/${workspaceId}/members/${member.id}/channel-access`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        
        if (!memberAccessResponse.ok) {
          throw new Error("Impossible de récupérer les droits d'accès");
        }
        
        const accessData = await memberAccessResponse.json();
        const accessMap = {};
        
        accessData.forEach(access => {
          accessMap[access.canalId] = access.accessType || "lecture_ecriture";
        });
        
        setAccessRights(accessMap);
      } catch (error) {
        console.error("Erreur lors du chargement des canaux privés:", error);
        setError(error.message || "Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrivateChannels();
  }, [show, workspaceId, member]);

  const handleAccessChange = async (channelId, accessType) => {
    // Éviter de changer si c'est déjà le même type
    if (accessRights[channelId] === accessType) return;
    
    setUpdatingChannelId(channelId);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/canaux/${channelId}/members/${member.id}/access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la modification des droits d'accès");
      }
      
      // Mettre à jour l'état local
      setAccessRights(prev => ({
        ...prev,
        [channelId]: accessType
      }));
    } catch (error) {
      console.error("Erreur lors de la modification des droits d'accès:", error);
      // Réinitialiser l'état précédent en cas d'erreur
    } finally {
      setUpdatingChannelId(null);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-access-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Droits d'accès - {member?.name}
          </h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="member-info-container">
            <div className="member-avatar-large">
              {member?.avatar || member?.photo_de_profil ? (
                <img src={member.avatar || member.photo_de_profil} alt={member.name} />
              ) : (
                <div className="avatar-placeholder">
                  {member?.name ? member.name[0].toUpperCase() : "?"}
                </div>
              )}
            </div>
            <div className="member-details">
              <h3>{member?.name}</h3>
              <span className="member-role">{member?.role || "membre"}</span>
            </div>
          </div>

          <div className="section-description">
            <p>Définissez les droits d'accès de ce membre pour chaque canal privé du workspace.</p>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <span>Chargement des canaux privés...</span>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : privateChannels.length === 0 ? (
            <div className="no-channels-message">
              Aucun canal privé disponible dans ce workspace.
            </div>
          ) : (
            <div className="channels-list">
              <div className="channels-list-header">
                <span className="channel-name-header">Canal</span>
                <span className="channel-access-header">Droits d'accès</span>
              </div>
              {privateChannels.map(channel => (
                <div key={channel.id_canal} className="channel-item">
                  <div className="channel-info">
                    <FaLock className="channel-icon" />
                    <span className="channel-name">{channel.nom}</span>
                  </div>
                  <div className="channel-access-controls">
                    <button
                      className={`access-button ${accessRights[channel.id_canal] === "lecture_ecriture" ? "active" : ""}`}
                      onClick={() => handleAccessChange(channel.id_canal, "lecture_ecriture")}
                      disabled={updatingChannelId === channel.id_canal}
                    >
                      <FaEdit className="access-icon" />
                      <span>Lecture et écriture</span>
                    </button>
                    <button
                      className={`access-button ${accessRights[channel.id_canal] === "lecture" ? "active" : ""}`}
                      onClick={() => handleAccessChange(channel.id_canal, "lecture")}
                      disabled={updatingChannelId === channel.id_canal}
                    >
                      <FaEye className="access-icon" />
                      <span>Lecture seule</span>
                    </button>
                    <button
                      className={`access-button danger ${!accessRights[channel.id_canal] ? "active" : ""}`}
                      onClick={() => handleAccessChange(channel.id_canal, "remove")}
                      disabled={updatingChannelId === channel.id_canal}
                    >
                      <FaTimes className="access-icon" />
                      <span>Aucun accès</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberAccessModal;
import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/config";

export const useWorkspaceMembers = (workspaceId, userStatuses = {}) => {
  // Member states
  const [members, setMembers] = useState({
    online: [],
    offline: [],
  });
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);
  
  // Sidebar visibility states
  const [showMembers, setShowMembers] = useState(true);
  const [showOnlineMembers, setShowOnlineMembers] = useState(true);
  const [showOfflineMembers, setShowOfflineMembers] = useState(true);

  // Current user role state
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Fetch workspace members function using useCallback
  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setMembersError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workspace members");
      }

      const data = await response.json();

      // Filter and format online members
      const onlineMembers = data
        .filter((member) => {
          // Vérifier le statut WebSocket en temps réel
          const wsStatus = userStatuses[member.id_utilisateur];
          
          // Si un statut WebSocket existe, l'utiliser
          if (wsStatus !== undefined) {
            return wsStatus === "online";
          }
          // Sinon utiliser le statut par défaut de la base de données (1 = online)
          return member.status === 1;
        })
        .map((member) => ({
          id: member.id_utilisateur,
          name: member.nom,
          avatar: member.photo_url || member.photo_de_profil || null,
          status: userStatuses[member.id_utilisateur] || "online",
          role: member.role.toLowerCase(),
        }));

      // Filter and format offline members
      const offlineMembers = data
        .filter((member) => {
          const wsStatus = userStatuses[member.id_utilisateur];
          // Logique inversée par rapport aux membres en ligne
          if (wsStatus !== undefined) {
            return wsStatus !== "online";
          }
          return member.status !== 1;
        })
        .map((member) => ({
          id: member.id_utilisateur,
          name: member.nom,
          avatar: member.photo_url || member.photo_de_profil || null,
          status: userStatuses[member.id_utilisateur] || "offline",
          role: member.role.toLowerCase(),
        }));

      setMembers({
        online: onlineMembers,
        offline: offlineMembers,
      });
    } catch (err) {
      console.error("Error fetching workspace members:", err);
      setMembersError(err.message);
      setMembers({ online: [], offline: [] });
    } finally {
      setLoadingMembers(false);
    }
  }, [workspaceId, userStatuses]);

  // Fetch current user role in workspace
  const fetchCurrentUserRole = useCallback(async (workspace, currentUserId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !workspace || !currentUserId) return;

      const res = await fetch(
        `${API_URL}/api/workspaces/${workspace.id}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;

      const members = await res.json();
      const me = members.find((m) => m.id_utilisateur === currentUserId);
      setCurrentUserRole(me?.role?.toLowerCase() || null);
    } catch (e) {
      setCurrentUserRole(null);
    }
  }, []);

  // Handle member role change
  const handleChangeMemberRole = async (memberId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members/${memberId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du changement de rôle");
      }

      // Refresh members list
      fetchWorkspaceMembers();
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      throw error;
    }
  };

  // Handle member removal from workspace
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer ce membre du workspace ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du retrait du membre");
      }

      // Refresh members list
      fetchWorkspaceMembers();
    } catch (error) {
      console.error("Erreur lors du retrait du membre:", error);
      throw error;
    }
  };

  // Handle member channel access
  const handleSetMemberChannelAccess = async (memberId, accessType, activeChannel) => {
    if (!activeChannel || !activeChannel.isPrivate) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/canaux/${activeChannel.id}/members/${memberId}/access`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accessType }),
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors de la modification des droits d'accès");
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la modification des droits d'accès:", error);
      throw error;
    }
  };

  // Visibility toggle functions
  const toggleMembers = () => setShowMembers(!showMembers);
  const toggleOnlineMembers = () => setShowOnlineMembers(!showOnlineMembers);
  const toggleOfflineMembers = () => setShowOfflineMembers(!showOfflineMembers);

  // Get role icon helper
  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return "👑";
      case "admin":
        return "⚡";
      case "moderator":
        return "🛡️";
      default:
        return "";
    }
  };

  // Get all members as a single array
  const getAllMembers = () => {
    return [...members.online, ...members.offline];
  };

  // Initialize members on mount and when userStatuses change
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId, userStatuses, fetchWorkspaceMembers]);

  return {
    // States
    members,
    loadingMembers,
    membersError,
    showMembers,
    showOnlineMembers,
    showOfflineMembers,
    currentUserRole,
    
    // Functions
    fetchWorkspaceMembers,
    fetchCurrentUserRole,
    handleChangeMemberRole,
    handleRemoveMember,
    handleSetMemberChannelAccess,
    toggleMembers,
    toggleOnlineMembers,
    toggleOfflineMembers,
    getRoleIcon,
    getAllMembers,
    setCurrentUserRole,
  };
};

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/config";

export const useWorkspaceChannels = (workspaceId) => {
  // Channel states
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [showChannels, setShowChannels] = useState(true);
  const [canalsLoading, setCanalsLoading] = useState(false);
  const [canalsError, setCanalsError] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);

  // Create Channel Modal state
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", isPrivate: false });
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");

  // Channel Context Menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    channelId: null,
    channelName: "",
    isPrivate: false,
  });

  // Edit Channel Modal state
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState({
    id: null,
    name: "",
    isPrivate: false,
  });
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [updateChannelError, setUpdateChannelError] = useState("");

  // Fetch canals function using useCallback
  const fetchCanals = useCallback(async () => {
    try {
      setCanalsLoading(true);
      setCanalsError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const data = await response.json();

      const formattedChannels = data.map((canal) => ({
        id: canal.id_canal,
        name: canal.nom,
        isPrivate: canal.is_private || false,
        description: canal.description || "",
      }));

      setChannels(formattedChannels);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setCanalsError(err.message);
      setChannels([]);
    } finally {
      setCanalsLoading(false);
    }
  }, [workspaceId]);

  // Fonction pour récupérer les détails d'un canal spécifique
  const fetchActiveChannel = useCallback(async (canalId) => {
    if (!canalId) {
      console.error("fetchActiveChannel: ID de canal non fourni");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Récupérer les détails du canal actif
      const canalDetailsResponse = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals/${canalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!canalDetailsResponse.ok) {
        const errorData = await canalDetailsResponse.json();
        throw new Error(errorData.message || "Erreur lors du chargement des détails du canal");
      }

      const canalDetails = await canalDetailsResponse.json();
      setActiveChannel({
        id: canalDetails.id_canal,
        name: canalDetails.nom,
        description: canalDetails.description || "",
        isPrivate: canalDetails.is_private || false,
        isCreator: canalDetails.isCreator || false,
        memberAccess: canalDetails.memberAccess || null,
        members: canalDetails.members || [],
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du canal actif:", error);
      throw error;
    }
  }, [workspaceId]);

  // Channel handlers
  const handleChannelInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewChannel({
      ...newChannel,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCreateChannel = (e) => {
    e.stopPropagation();
    setShowCreateChannelModal(true);
    setNewChannel({ name: "", isPrivate: false });
    setChannelError("");
  };

  const handleCloseModal = () => setShowCreateChannelModal(false);

  const handleSubmitChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.name.trim()) {
      setChannelError("Le nom du canal est requis");
      return;
    }
    try {
      setIsCreatingChannel(true);
      setChannelError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom: newChannel.name,
            is_private: newChannel.isPrivate,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la création du canal"
        );
      }
      fetchCanals();
      setShowCreateChannelModal(false);
    } catch (err) {
      console.error("Erreur lors de la création du canal:", err);
      setChannelError(err.message || "Une erreur est survenue");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleChannelContextMenu = (e, channel) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      channelId: channel.id,
      channelName: channel.name,
      isPrivate: channel.isPrivate,
    });
  };

  const handleCloseContextMenu = () =>
    setContextMenu({ ...contextMenu, visible: false });

  const handleEditChannel = () => {
    setEditingChannel({
      id: contextMenu.channelId,
      name: contextMenu.channelName,
      isPrivate: contextMenu.isPrivate,
    });
    setShowEditChannelModal(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleSubmitEditChannel = async (e) => {
    e.preventDefault();
    if (!editingChannel.name.trim()) {
      setUpdateChannelError("Le nom du canal est requis");
      return;
    }
    try {
      setIsUpdatingChannel(true);
      setUpdateChannelError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals/${editingChannel.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom: editingChannel.name,
            is_private: editingChannel.isPrivate,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la mise à jour du canal"
        );
      }
      fetchCanals();
      setShowEditChannelModal(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du canal:", err);
      setUpdateChannelError(err.message || "Une erreur est survenue");
    } finally {
      setIsUpdatingChannel(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce canal ?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals/${contextMenu.channelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la suppression du canal"
        );
      }
      fetchCanals();
      setContextMenu({ ...contextMenu, visible: false });
    } catch (err) {
      console.error("Erreur lors de la suppression du canal:", err);
      alert(err.message || "Une erreur est survenue");
    }
  };

  const handleSelectChannel = useCallback(
    async (channel) => {
      try {
        if (!channel || !channel.id) {
          console.error("handleSelectChannel: canal sans ID");
          return;
        }
        
        await fetchActiveChannel(channel.id);
      } catch (error) {
        console.error("Erreur lors de la sélection du canal:", error);
      }
    },
    [fetchActiveChannel]
  );

  // Utility functions
  const toggleChannelsVisibility = () => setShowChannels(!showChannels);

  // Filter channels effect
  useEffect(() => {
    setFilteredChannels(channels);
  }, [channels]);

  // Initialize channels on mount
  useEffect(() => {
    if (workspaceId) {
      fetchCanals();
    }
  }, [workspaceId, fetchCanals]);

  return {
    // States
    channels: filteredChannels,
    showChannels,
    canalsLoading,
    canalsError,
    activeChannel,
    setActiveChannel,
    showCreateChannelModal,
    newChannel,
    isCreatingChannel,
    channelError,
    contextMenu,
    showEditChannelModal,
    editingChannel,
    isUpdatingChannel,
    updateChannelError,
    
    // Functions
    fetchCanals,
    fetchActiveChannel,
    handleChannelInputChange,
    handleCreateChannel,
    handleCloseModal,
    handleSubmitChannel,
    handleChannelContextMenu,
    handleCloseContextMenu,
    handleEditChannel,
    handleSubmitEditChannel,
    handleDeleteChannel,
    handleSelectChannel,
    toggleChannelsVisibility,
    setNewChannel,
    setEditingChannel,
    setShowEditChannelModal,
  };
};

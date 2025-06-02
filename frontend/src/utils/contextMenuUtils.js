// Utilitaires pour créer des menus contextuels standardisés
import React from "react";
import {
  FaReply,
  FaRegSmile,
  FaEdit,
  FaTrashAlt,
  FaArrowUp,
  FaArrowDown,
  FaUserCog,
  FaUsers,
  FaCircle,
  FaClock,
  FaTimesCircle,
  FaRegMoon,
} from "react-icons/fa";

/**
 * Crée les éléments de menu contextuel pour les messages
 * @param {Object} options - Options pour le menu
 * @param {boolean} options.isOwnMessage - Si le message appartient à l'utilisateur actuel
 * @param {Function} options.onReply - Fonction pour répondre au message
 * @param {Function} options.onEdit - Fonction pour éditer le message
 * @param {Function} options.onDelete - Fonction pour supprimer le message
 * @param {Function} options.onAddReaction - Fonction pour ajouter une réaction
 * @returns {Array} Tableau d'éléments de menu
 */
export const createMessageContextMenu = ({
  isOwnMessage = false,
  onReply,
  onEdit,
  onDelete,
  onAddReaction,
}) => {
  const items = [
    {
      type: "item",
      label: "Répondre",
      icon: <FaReply />,
      onClick: onReply,
    },
    {
      type: "item",
      label: "Ajouter une réaction",
      icon: <FaRegSmile />,
      onClick: onAddReaction,
    },
  ];

  if (isOwnMessage) {
    items.push(
      {
        type: "separator",
      },
      {
        type: "item",
        label: "Modifier",
        icon: <FaEdit />,
        onClick: onEdit,
      },
      {
        type: "item",
        label: "Supprimer",
        icon: <FaTrashAlt />,
        variant: "danger",
        onClick: onDelete,
      }
    );
  }

  return items;
};

/**
 * Crée les éléments de menu contextuel pour les canaux
 * @param {Object} options - Options pour le menu
 * @param {boolean} options.isPrivate - Si le canal est privé
 * @param {Function} options.onEdit - Fonction pour éditer le canal
 * @param {Function} options.onManageMembers - Fonction pour gérer les membres
 * @param {Function} options.onDelete - Fonction pour supprimer le canal
 * @returns {Array} Tableau d'éléments de menu
 */
export const createChannelContextMenu = ({
  isPrivate = false,
  onEdit,
  onManageMembers,
  onDelete,
}) => {
  const items = [
    {
      type: "item",
      label: "Modifier le canal",
      icon: <FaEdit />,
      onClick: onEdit,
    },
  ];

  if (isPrivate && onManageMembers) {
    items.push({
      type: "item",
      label: "Gérer les membres",
      icon: <FaUsers />,
      onClick: onManageMembers,
    });
  }

  items.push(
    {
      type: "separator",
    },
    {
      type: "item",
      label: "Supprimer le canal",
      icon: <FaTrashAlt />,
      variant: "danger",
      onClick: onDelete,
    }
  );

  return items;
};

/**
 * Crée les éléments de menu contextuel pour les conversations
 * @param {Object} options - Options pour le menu
 * @param {Function} options.onOpen - Fonction pour ouvrir la conversation
 * @param {Function} options.onDelete - Fonction pour supprimer la conversation
 * @returns {Array} Tableau d'éléments de menu
 */
export const createConversationContextMenu = ({ onOpen, onDelete }) => [
  {
    type: "item",
    label: "Ouvrir la conversation",
    onClick: onOpen,
  },
  {
    type: "separator",
  },
  {
    type: "item",
    label: "Supprimer la conversation",
    variant: "danger",
    onClick: onDelete,
  },
];

/**
 * Crée les éléments de menu contextuel pour les membres
 * @param {Object} options - Options pour le menu
 * @param {string} options.currentUserRole - Rôle de l'utilisateur actuel
 * @param {string} options.memberRole - Rôle du membre
 * @param {Function} options.onPromoteToAdmin - Fonction pour promouvoir en admin
 * @param {Function} options.onDemoteToMember - Fonction pour rétrograder en membre
 * @param {Function} options.onManageAccess - Fonction pour gérer les droits d'accès
 * @returns {Array} Tableau d'éléments de menu
 */
export const createMemberContextMenu = ({
  currentUserRole,
  memberRole,
  onPromoteToAdmin,
  onDemoteToMember,
  onManageAccess,
}) => {
  const items = [];

  // Promotion en admin (owner peut promouvoir member, admin peut promouvoir member)
  if (
    ((currentUserRole === "owner" && memberRole === "member") ||
      (currentUserRole === "admin" && memberRole === "member")) &&
    onPromoteToAdmin
  ) {
    items.push({
      type: "item",
      label: "Promouvoir en admin",
      icon: <FaArrowUp />,
      onClick: onPromoteToAdmin,
    });
  }

  // Rétrogradation en membre (owner peut rétrograder admin)
  if (
    currentUserRole === "owner" &&
    memberRole === "admin" &&
    onDemoteToMember
  ) {
    items.push({
      type: "item",
      label: "Rétrograder en membre",
      icon: <FaArrowDown />,
      onClick: onDemoteToMember,
    });
  }

  // Gestion des droits d'accès
  if (
    (currentUserRole === "owner" || currentUserRole === "admin") &&
    onManageAccess
  ) {
    if (items.length > 0) {
      items.push({ type: "separator" });
    }
    items.push({
      type: "item",
      label: "Gérer les droits d'accès",
      icon: <FaUserCog />,
      onClick: onManageAccess,
    });
  }

  return items;
};

/**
 * Crée les éléments de menu contextuel pour le statut utilisateur
 * @param {Object} options - Options pour le menu
 * @param {Function} options.onStatusChange - Fonction pour changer le statut
 * @returns {Array} Tableau d'éléments de menu
 */
export const createStatusContextMenu = ({ onStatusChange }) => {
  const statuses = [
    {
      id: "online",
      label: "En ligne",
      icon: <FaCircle style={{ color: "#44b700" }} />,
    },
    {
      id: "away",
      label: "Absent",
      icon: <FaClock style={{ color: "#ffc107" }} />,
    },
    {
      id: "dnd",
      label: "Ne pas déranger",
      icon: <FaTimesCircle style={{ color: "#f44336" }} />,
    },
    {
      id: "invisible",
      label: "Invisible",
      icon: <FaRegMoon style={{ color: "#9e9e9e" }} />,
    },
  ];

  return statuses.map((status) => ({
    type: "item",
    label: status.label,
    icon: status.icon,
    onClick: () => onStatusChange(status.id),
  }));
};

/**
 * Utilitaires pour créer des éléments de menu contextuel standardisés
 */
export const contextMenuUtils = {
  /**
   * Crée un séparateur de menu
   */
  separator: () => ({ type: "separator" }),

  /**
   * Éléments de menu pour les messages
   */
  message: {
    reply: (onReply) => ({
      label: "Répondre",
      icon: <FaReply />,
      onClick: onReply,
    }),

    addReaction: (onAddReaction) => ({
      label: "Ajouter une réaction",
      icon: <FaRegSmile />,
      onClick: onAddReaction,
    }),

    edit: (onEdit, canEdit = true) => ({
      label: "Modifier",
      icon: <FaEdit />,
      onClick: onEdit,
      hidden: !canEdit,
    }),

    delete: (onDelete, canDelete = true) => ({
      label: "Supprimer",
      icon: <FaTrashAlt />,
      onClick: onDelete,
      variant: "danger",
      hidden: !canDelete,
    }),
  },

  /**
   * Éléments de menu pour les canaux
   */
  channel: {
    edit: (onEdit) => ({
      label: "Modifier le canal",
      icon: <FaEdit />,
      onClick: onEdit,
    }),

    manageMembers: (onManageMembers, isPrivate = false) => ({
      label: "Gérer les membres",
      icon: <FaUsers />,
      onClick: onManageMembers,
      hidden: !isPrivate,
    }),

    delete: (onDelete) => ({
      label: "Supprimer le canal",
      icon: <FaTrashAlt />,
      onClick: onDelete,
      variant: "danger",
    }),
  },

  /**
   * Éléments de menu pour les conversations
   */
  conversation: {
    open: (onOpen) => ({
      label: "Ouvrir la conversation",
      icon: <FaHashtag />,
      onClick: onOpen,
    }),

    delete: (onDelete) => ({
      label: "Supprimer la conversation",
      icon: <FaTrashAlt />,
      onClick: () => {
        if (
          window.confirm(
            "Voulez-vous vraiment supprimer cette conversation ? Les messages seront définitivement supprimés."
          )
        ) {
          onDelete();
        }
      },
      variant: "danger",
    }),
  },

  /**
   * Éléments de menu pour les membres
   */
  member: {
    promoteToAdmin: (onPromote, canPromote = true) => ({
      label: "Promouvoir en admin",
      icon: <FaArrowUp />,
      onClick: onPromote,
      hidden: !canPromote,
    }),

    demoteToMember: (onDemote, canDemote = true) => ({
      label: "Rétrograder en membre",
      icon: <FaArrowDown />,
      onClick: onDemote,
      hidden: !canDemote,
    }),

    manageAccess: (onManageAccess) => ({
      label: "Gérer les droits d'accès",
      icon: <FaUserCog />,
      onClick: onManageAccess,
    }),
  },

  /**
   * Éléments de menu pour le statut utilisateur
   */
  status: {
    online: (onSetStatus) => ({
      label: "En ligne",
      icon: <FaCircle style={{ color: "#44b700" }} />,
      onClick: () => onSetStatus("online"),
    }),

    away: (onSetStatus) => ({
      label: "Absent",
      icon: <FaClock style={{ color: "#ffa500" }} />,
      onClick: () => onSetStatus("away"),
    }),

    dnd: (onSetStatus) => ({
      label: "Ne pas déranger",
      icon: <FaTimesCircle style={{ color: "#f04747" }} />,
      onClick: () => onSetStatus("dnd"),
    }),

    invisible: (onSetStatus) => ({
      label: "Invisible",
      icon: <FaRegMoon style={{ color: "#747f8d" }} />,
      onClick: () => onSetStatus("invisible"),
    }),

    offline: (onSetStatus) => ({
      label: "Hors ligne",
      icon: <FaRegMoon style={{ color: "#747f8d" }} />,
      onClick: () => onSetStatus("offline"),
    }),
  },
};



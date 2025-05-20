// Hook personnalisé pour gérer les mentions d'utilisateurs
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.172:3000";

/**
 * Hook pour gérer les mentions d'utilisateurs dans les messages
 * @returns {Object} - États et fonctions liés aux mentions
 */
export const useMentions = () => {
  const navigate = useNavigate();
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [mentionMap, setMentionMap] = useState(new Map());

  /**
   * Recherche des utilisateurs pour les mentions
   * @param {string} searchText - Texte de recherche
   */
  const searchUserMentions = useCallback(async (searchText) => {
    if (!searchText && searchText !== "") {
      setShowMentionSuggestions(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/users/search?q=${encodeURIComponent(searchText)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche d'utilisateurs");
      }

      const data = await response.json();
      setMentionSuggestions(data);
      setShowMentionSuggestions(data.length > 0);
      setActiveMentionIndex(0);
    } catch (error) {
      console.error("Erreur:", error);
      setShowMentionSuggestions(false);
    }
  }, []);

  /**
   * Insère une mention dans le message
   * @param {Object} user - Utilisateur à mentionner
   * @param {string} currentText - Texte actuel du message
   * @returns {Object} - Nouveau texte et position du curseur
   */
  const insertMention = useCallback(
    (user, currentText) => {
      if (mentionStartIndex === null) {
        return { text: currentText, cursorPosition: currentText.length };
      }

      // Partie avant la mention
      const beforeMention = currentText.substring(0, mentionStartIndex);

      // Partie après le texte de recherche
      const afterSearchText = currentText.substring(
        mentionStartIndex + mentionSearch.length + 1
      );

      // Format visible pour l'utilisateur: @username
      const visibleText = `${beforeMention}@${user.name} ${afterSearchText}`;

      // Format interne pour le traitement: @[userId:username]
      const internalFormat = `@[${user.id}:${user.name}]`;

      // Mémoriser la position actuelle du curseur
      const cursorPosition = mentionStartIndex + user.name.length + 2;

      // Stocker en mémoire les correspondances entre affichage et format interne
      const newMentionMap = new Map(mentionMap);
      newMentionMap.set(`@${user.name}`, internalFormat);
      setMentionMap(newMentionMap);

      // Fermer la liste de suggestions
      setShowMentionSuggestions(false);
      setMentionStartIndex(null);

      return { text: visibleText, cursorPosition, mentionMap: newMentionMap };
    },
    [mentionStartIndex, mentionSearch, mentionMap]
  );

  /**
   * Traite le texte pour rendre les mentions cliquables
   * @param {string} text - Texte à traiter
   * @returns {Array} - Tableau d'éléments React
   */
  const renderTextWithMentions = useCallback(
    (text) => {
      if (!text) {
        return text;
      }

      // Regex pour détecter les mentions au format @[userId:username]
      const mentionRegex = /@\[(\w+):([^\]]+)\]/g;

      // Si pas de mentions, retourner le texte tel quel
      if (!mentionRegex.test(text)) {
        return text;
      }

      // Réinitialiser le pointeur de regex
      mentionRegex.lastIndex = 0;

      // Diviser le texte en parties normales et mentions
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = mentionRegex.exec(text)) !== null) {
        // Ajouter le texte avant la mention
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        const userId = match[1];
        const username = match[2];
        parts.push(
          <span
            key={`mention-${userId}-${match.index}`}
            className="mention-tag"
            onClick={() => navigate(`/profile/${userId}`)}
          >
            @{username}
          </span>
        );

        lastIndex = mentionRegex.lastIndex;
      }

      // Ajouter le texte restant après la dernière mention
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts;
    },
    [navigate]
  );

  /**
   * Gère la saisie dans le champ de message pour détecter les mentions
   * @param {Event} e - Événement de changement
   * @param {string} currentText - Texte actuel du message
   * @returns {Object} - État des mentions
   */
  const handleInputMention = useCallback(
    (e, currentText) => {
      const value = e.target.value;

      // Vérifier si l'utilisateur est en train de taper une mention
      const lastAtIndex = value.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        // Vérifier si le @ est au début du message ou précédé d'un espace
        const isValidMentionStart =
          lastAtIndex === 0 ||
          value.charAt(lastAtIndex - 1) === " " ||
          value.charAt(lastAtIndex - 1) === "\n";

        if (isValidMentionStart) {
          // Extraire le texte après le @ jusqu'au curseur
          const searchText = value.substring(lastAtIndex + 1);
          setMentionSearch(searchText);
          setMentionStartIndex(lastAtIndex);
          searchUserMentions(searchText);
          return { showMentionSuggestions: true };
        }
      }

      // Pas de mention en cours
      return { showMentionSuggestions: false };
    },
    [searchUserMentions]
  );

  /**
   * Convertit le texte avec les mentions visibles au format interne
   * @param {string} visibleText - Texte visible avec mentions au format @username
   * @returns {string} - Texte avec mentions au format @[userId:username]
   */
  const convertMentionsToInternalFormat = useCallback(
    (visibleText) => {
      if (!visibleText || mentionMap.size === 0) {
        return visibleText;
      }

      let internalText = visibleText;

      // Remplacer toutes les mentions visuelles par leur format interne
      mentionMap.forEach((internalFormat, visualFormat) => {
        // Utiliser une regex pour remplacer uniquement les mentions complètes (pas les parties de mots)
        const mentionRegex = new RegExp(`${visualFormat}(\\s|$)`, "g");
        internalText = internalText.replace(mentionRegex, `${internalFormat} `);
      });

      return internalText;
    },
    [mentionMap]
  );

  /**
   * Gère les touches spéciales pour la navigation dans les suggestions
   * @param {Event} e - Événement clavier
   */
  const handleMentionKeyDown = useCallback(
    (e) => {
      if (!showMentionSuggestions || mentionSuggestions.length === 0) {
        return false;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) =>
          prev < mentionSuggestions.length - 1 ? prev + 1 : prev
        );
        return true;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return true;
      } else if (e.key === "Enter" && mentionSuggestions.length > 0) {
        e.preventDefault();
        return { selectedUser: mentionSuggestions[activeMentionIndex] };
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionSuggestions(false);
        return true;
      }

      return false;
    },
    [showMentionSuggestions, mentionSuggestions, activeMentionIndex]
  );

  // Réinitialiser les mentions quand le composant est démonté
  useEffect(() => {
    return () => {
      setMentionMap(new Map());
      setMentionSuggestions([]);
      setShowMentionSuggestions(false);
    };
  }, []);

  return {
    mentionSearch,
    setMentionSearch,
    showMentionSuggestions,
    setShowMentionSuggestions,
    mentionSuggestions,
    setMentionSuggestions,
    activeMentionIndex,
    setActiveMentionIndex,
    mentionStartIndex,
    setMentionStartIndex,
    mentionMap,
    setMentionMap,
    searchUserMentions,
    insertMention,
    renderTextWithMentions,
    handleInputMention,
    convertMentionsToInternalFormat,
    handleMentionKeyDown,
  };
};

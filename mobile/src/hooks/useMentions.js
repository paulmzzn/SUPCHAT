import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

export const useMentions = () => {
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [mentionableUsers, setMentionableUsers] = useState([]);

  // Recherche des utilisateurs mentionnables dans un workspace
  const fetchMentionableUsers = useCallback(async (workspaceId) => {
    if (!workspaceId) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const members = await response.json();
        
        // Ajouter Mistral AI comme premier utilisateur mentionnable
        const mistralUser = {
          id: '00000000-0000-0000-0000-000000000001',
          nom: 'Mistral AI',
          username: 'mistral',
          photo_de_profil: 'https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp',
          role: 'bot',
          isBot: true,
          status: 'online'
        };

        // Formater les membres
        const formattedMembers = members.map(member => ({
          id: member.id_utilisateur || member.id,
          nom: member.nom || member.name,
          username: member.username,
          photo_de_profil: member.photo_de_profil || member.avatar,
          role: member.role || 'member',
          isBot: false,
          status: member.status || 'offline'
        }));

        setMentionableUsers([mistralUser, ...formattedMembers]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs mentionnables:', error);
    }
  }, []);

  // Détecter et gérer les mentions dans le texte
  const handleMentionInput = useCallback((text, cursorPosition) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    // Vérifier si le @ est au début ou précédé d'un espace/saut de ligne
    const isValidMentionStart = lastAtIndex !== -1 && 
      (lastAtIndex === 0 || 
       textBeforeCursor.charAt(lastAtIndex - 1) === ' ' || 
       textBeforeCursor.charAt(lastAtIndex - 1) === '\n');

    if (isValidMentionStart) {
      // Récupérer le texte après le @
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Vérifier qu'il n'y a pas d'espace dans le texte après @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        
        // Filtrer les utilisateurs selon la requête
        const filteredUsers = mentionableUsers.filter(user =>
          user.nom.toLowerCase().includes(textAfterAt.toLowerCase()) ||
          (user.username && user.username.toLowerCase().includes(textAfterAt.toLowerCase()))
        );
        
        setMentionSuggestions(filteredUsers);
        setShowMentionSuggestions(filteredUsers.length > 0);
        setActiveMentionIndex(0);
        return true;
      }
    }
    
    // Cacher les suggestions si pas de mention valide
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    return false;
  }, [mentionableUsers]);

  // Sélectionner une mention
  const selectMention = useCallback((user, currentText, cursorPosition) => {
    if (mentionStartIndex === null) return { newText: currentText, newCursorPosition: cursorPosition };

    // Partie avant la mention
    const beforeMention = currentText.substring(0, mentionStartIndex);
    
    // Partie après le texte de recherche actuel
    const afterMention = currentText.substring(cursorPosition);
    
    // Créer la mention au format [@nom](id)
    const mentionText = `@[${user.nom}](${user.id}) `;
    
    // Nouveau texte complet
    const newText = beforeMention + mentionText + afterMention;
    const newCursorPosition = mentionStartIndex + mentionText.length;
    
    // Fermer les suggestions
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    
    return { newText, newCursorPosition };
  }, [mentionStartIndex]);

  // Navigation dans les suggestions
  const navigateMentions = useCallback((direction) => {
    if (!showMentionSuggestions || mentionSuggestions.length === 0) return;
    
    setActiveMentionIndex(prevIndex => {
      if (direction === 'up') {
        return prevIndex > 0 ? prevIndex - 1 : mentionSuggestions.length - 1;
      } else {
        return prevIndex < mentionSuggestions.length - 1 ? prevIndex + 1 : 0;
      }
    });
  }, [showMentionSuggestions, mentionSuggestions.length]);

  // Sélectionner la mention active
  const selectActiveMention = useCallback((currentText, cursorPosition) => {
    if (showMentionSuggestions && mentionSuggestions.length > 0) {
      return selectMention(mentionSuggestions[activeMentionIndex], currentText, cursorPosition);
    }
    return { newText: currentText, newCursorPosition: cursorPosition };
  }, [showMentionSuggestions, mentionSuggestions, activeMentionIndex, selectMention]);

  // Fermer les suggestions
  const closeMentionSuggestions = useCallback(() => {
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
  }, []);

  return {
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
    mentionQuery,
    mentionableUsers,
    fetchMentionableUsers,
    handleMentionInput,
    selectMention,
    navigateMentions,
    selectActiveMention,
    closeMentionSuggestions,
  };
};

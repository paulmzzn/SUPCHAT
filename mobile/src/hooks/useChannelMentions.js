import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

export const useChannelMentions = () => {
  const [showChannelSuggestions, setShowChannelSuggestions] = useState(false);
  const [channelSuggestions, setChannelSuggestions] = useState([]);
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);
  const [channelQuery, setChannelQuery] = useState('');
  const [channelStartIndex, setChannelStartIndex] = useState(null);
  const [mentionableChannels, setMentionableChannels] = useState([]);

  // Recherche des canaux mentionnables dans un workspace
  const fetchMentionableChannels = useCallback(async (workspaceId) => {
    if (!workspaceId) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspace/${workspaceId}/canals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const channels = await response.json();
        
        // Formater les canaux
        const formattedChannels = channels.map(channel => ({
          id: channel.id_canal,
          name: channel.nom,
          description: channel.description,
          isPrivate: channel.is_private || false,
          memberCount: channel.member_count || 0,
        }));

        setMentionableChannels(formattedChannels);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des canaux mentionnables:', error);
    }
  }, []);

  // Détecter et gérer les mentions de canaux dans le texte
  const handleChannelInput = useCallback((text, cursorPosition) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    // Vérifier si le # est au début ou précédé d'un espace/saut de ligne
    const isValidChannelStart = lastHashIndex !== -1 && 
      (lastHashIndex === 0 || 
       textBeforeCursor.charAt(lastHashIndex - 1) === ' ' || 
       textBeforeCursor.charAt(lastHashIndex - 1) === '\n');

    if (isValidChannelStart) {
      // Récupérer le texte après le #
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      
      // Vérifier qu'il n'y a pas d'espace dans le texte après #
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setChannelQuery(textAfterHash);
        setChannelStartIndex(lastHashIndex);
        
        // Filtrer les canaux selon la requête
        const filteredChannels = mentionableChannels.filter(channel =>
          channel.name.toLowerCase().includes(textAfterHash.toLowerCase())
        );
        
        setChannelSuggestions(filteredChannels);
        setShowChannelSuggestions(filteredChannels.length > 0);
        setActiveChannelIndex(0);
        return true;
      }
    }
    
    // Cacher les suggestions si pas de mention valide
    setShowChannelSuggestions(false);
    setChannelQuery('');
    setChannelStartIndex(null);
    return false;
  }, [mentionableChannels]);

  // Sélectionner une mention de canal
  const selectChannel = useCallback((channel, currentText, cursorPosition) => {
    if (channelStartIndex === null) return { newText: currentText, newCursorPosition: cursorPosition };

    // Partie avant la mention
    const beforeMention = currentText.substring(0, channelStartIndex);
    
    // Partie après le texte de recherche actuel
    const afterMention = currentText.substring(cursorPosition);
    
    // Créer la mention au format simple #nom-du-canal (comme dans le frontend)
    const channelText = `#${channel.name} `;
    
    // Nouveau texte complet
    const newText = beforeMention + channelText + afterMention;
    const newCursorPosition = channelStartIndex + channelText.length;
    
    // Fermer les suggestions
    setShowChannelSuggestions(false);
    setChannelQuery('');
    setChannelStartIndex(null);
    
    return { newText, newCursorPosition };
  }, [channelStartIndex]);

  // Navigation dans les suggestions
  const navigateChannels = useCallback((direction) => {
    if (!showChannelSuggestions || channelSuggestions.length === 0) return;
    
    setActiveChannelIndex(prevIndex => {
      if (direction === 'up') {
        return prevIndex > 0 ? prevIndex - 1 : channelSuggestions.length - 1;
      } else {
        return prevIndex < channelSuggestions.length - 1 ? prevIndex + 1 : 0;
      }
    });
  }, [showChannelSuggestions, channelSuggestions.length]);

  // Sélectionner la mention active
  const selectActiveChannel = useCallback((currentText, cursorPosition) => {
    if (showChannelSuggestions && channelSuggestions.length > 0) {
      return selectChannel(channelSuggestions[activeChannelIndex], currentText, cursorPosition);
    }
    return { newText: currentText, newCursorPosition: cursorPosition };
  }, [showChannelSuggestions, channelSuggestions, activeChannelIndex, selectChannel]);

  // Fermer les suggestions
  const closeChannelSuggestions = useCallback(() => {
    setShowChannelSuggestions(false);
    setChannelQuery('');
    setChannelStartIndex(null);
  }, []);

  return {
    showChannelSuggestions,
    channelSuggestions,
    activeChannelIndex,
    channelQuery,
    mentionableChannels,
    fetchMentionableChannels,
    handleChannelInput,
    selectChannel,
    navigateChannels,
    selectActiveChannel,
    closeChannelSuggestions,
  };
};

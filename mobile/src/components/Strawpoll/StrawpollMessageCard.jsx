import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StrawpollWebView from './StrawpollWebView';

const StrawpollMessageCard = ({ 
  messageContent, 
  theme, 
  onVote, 
  onViewResults, 
  isOwn 
}) => {
  const [webViewVisible, setWebViewVisible] = useState(false);

  // Extraire les informations du sondage depuis le contenu du message
  const extractPollInfo = (content) => {
    const strawpollRegex = /Sondage créé\s*:\s*([^\[]*)\[([^\]]+)\]\((https?:\/\/strawpoll\.com\/[^\)]+)\)\s*\[strawpoll:([a-zA-Z0-9]+)\]/;
    const match = content.match(strawpollRegex);
    
    if (match) {
      return {
        title: match[1].trim() || match[2], // Titre avant [Voter] ou texte du lien
        linkText: match[2], // Texte du lien (généralement "Voter")
        url: match[3], // URL complète
        pollId: match[4] // ID du sondage
      };
    }
    
    return null;
  };

  const pollInfo = extractPollInfo(messageContent);
  
  if (!pollInfo) {
    return null;
  }

  const handleVote = () => {
    // Ouvrir le WebView intégré au lieu du navigateur externe
    setWebViewVisible(true);
  };

  const handleViewResults = () => {
    if (onViewResults) {
      onViewResults(pollInfo.pollId);
    }
  };

  const handleCloseWebView = () => {
    setWebViewVisible(false);
  };

  const styles = getStyles(theme, isOwn);

  return (
    <>
      <View style={styles.container}>
        {/* Header avec icône et titre */}
        <View style={styles.header}>
          <Ionicons 
            name="bar-chart" 
            size={18} 
            color={isOwn ? '#FFFFFF' : theme.accentPrimary} 
          />
          <Text style={styles.title} numberOfLines={2}>
            {pollInfo.title}
          </Text>
        </View>

        {/* Indicateur de sondage */}
        <Text style={styles.subtitle}>
          Sondage Strawpoll
        </Text>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.voteButton]} 
            onPress={handleVote}
          >
            <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Voter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resultsButton]} 
            onPress={handleViewResults}
          >
            <Ionicons name="analytics-outline" size={16} color={isOwn ? '#FFFFFF' : theme.textPrimary} />
            <Text style={[styles.actionButtonText, styles.resultsButtonText]}>
              Résultats
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView Modal pour voter */}
      <StrawpollWebView
        visible={webViewVisible}
        pollUrl={pollInfo.url}
        pollTitle={pollInfo.title}
        onClose={handleCloseWebView}
        theme={theme}
      />
    </>
  );
};

const getStyles = (theme, isOwn) => StyleSheet.create({
  container: {
    backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(138, 43, 226, 0.1)',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(138, 43, 226, 0.3)',
    marginVertical: 6,
    minWidth: 280, // Largeur minimale plus grande
    maxWidth: 340, // Largeur maximale augmentée
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: isOwn ? '#FFFFFF' : theme.textPrimary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary,
    marginBottom: 18,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 14, // Espacement augmenté entre les boutons
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, // Padding vertical augmenté
    paddingHorizontal: 20, // Padding horizontal augmenté
    borderRadius: 8,
    gap: 8, // Espacement entre l'icône et le texte
    minHeight: 44, // Hauteur minimale pour éviter les écrasements
  },
  voteButton: {
    backgroundColor: '#8A2BE2',
  },
  resultsButton: {
    backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(138, 43, 226, 0.2)',
    borderWidth: 1,
    borderColor: isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(138, 43, 226, 0.4)',
  },
  actionButtonText: {
    fontSize: 15, // Taille de police légèrement augmentée
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 0, // Empêche le texte de se rétrécir
  },
  resultsButtonText: {
    color: isOwn ? '#FFFFFF' : theme.textPrimary,
  },
});

export default StrawpollMessageCard;
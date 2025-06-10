import React from 'react';
import { View, TouchableOpacity, Text, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStyles } from './MentionSuggestions.styles';

const MentionSuggestions = ({ 
  suggestions, 
  activeMentionIndex, 
  onSelectMention, 
  themeColors, 
  visible 
}) => {
  const styles = getStyles(themeColors);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderMentionItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.mentionItem,
        index === activeMentionIndex && styles.mentionItemActive
      ]}
      onPress={() => onSelectMention(item)}
      activeOpacity={0.7}
    >
      <View style={styles.mentionAvatar}>
        {item.photo_de_profil ? (
          <Image 
            source={{ uri: item.photo_de_profil }} 
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.nom ? item.nom.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        {item.isBot && (
          <View style={styles.botBadge}>
            <Ionicons name="flash" size={8} color={themeColors.textOnAccent} />
          </View>
        )}
      </View>
      
      <View style={styles.mentionInfo}>
        <Text style={styles.mentionName} numberOfLines={1}>
          {item.nom}
        </Text>
        <View style={styles.mentionStatus}>
          {item.isBot ? (
            <Text style={styles.mentionStatusText}>Assistant IA</Text>
          ) : (
            <>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status, themeColors) }
              ]} />
              <Text style={styles.mentionStatusText}>
                {getStatusText(item.status)}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="at" size={16} color={themeColors.accentPrimary} />
        <Text style={styles.headerText}>Mentionner un utilisateur</Text>
      </View>
      
      <FlatList
        data={suggestions}
        renderItem={renderMentionItem}
        keyExtractor={(item) => item.id}
        style={styles.suggestionsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(data, index) => (
          { length: 56, offset: 56 * index, index }
        )}
      />
    </View>
  );
};

const getStatusColor = (status, themeColors) => {
  switch (status) {
    case 'online':
      return '#4CAF50';
    case 'away':
      return '#FF9800';
    case 'dnd':
      return '#F44336';
    case 'invisible':
    case 'offline':
    default:
      return themeColors.textMuted;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'online':
      return 'En ligne';
    case 'away':
      return 'Absent';
    case 'dnd':
      return 'Ne pas déranger';
    case 'invisible':
      return 'Invisible';
    case 'offline':
    default:
      return 'Hors ligne';
  }
};

export default MentionSuggestions;

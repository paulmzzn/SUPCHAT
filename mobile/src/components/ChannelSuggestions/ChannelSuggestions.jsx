import React from 'react';
import { View, TouchableOpacity, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStyles } from './ChannelSuggestions.styles';

const ChannelSuggestions = ({ 
  suggestions, 
  activeChannelIndex, 
  onSelectChannel, 
  themeColors, 
  visible 
}) => {
  const styles = getStyles(themeColors);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderChannelItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.channelItem,
        index === activeChannelIndex && styles.channelItemActive
      ]}
      onPress={() => onSelectChannel(item)}
      activeOpacity={0.7}
    >
      <View style={styles.channelIcon}>
        {item.isPrivate ? (
          <Ionicons name="lock-closed" size={20} color={themeColors.textSecondary} />
        ) : (
          <Text style={styles.hashtagIcon}>#</Text>
        )}
      </View>
      
      <View style={styles.channelInfo}>
        <Text style={styles.channelName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.channelDetails}>
          {item.description ? (
            <Text style={styles.channelDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : (
            <Text style={styles.channelDescription} numberOfLines={1}>
              {item.isPrivate ? 'Canal privé' : 'Canal public'}
            </Text>
          )}
        </View>
      </View>
      
      {item.memberCount > 0 && (
        <View style={styles.memberCount}>
          <Ionicons name="people" size={12} color={themeColors.textMuted} />
          <Text style={styles.memberCountText}>{item.memberCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.hashtagIcon}>#</Text>
        <Text style={styles.headerText}>Mentionner un canal</Text>
      </View>
      
      <FlatList
        data={suggestions}
        renderItem={renderChannelItem}
        keyExtractor={(item) => item.id.toString()}
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

export default ChannelSuggestions;

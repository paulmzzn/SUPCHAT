import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, TextInput, Image, 
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './ConversationsListScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.119:3000';

const ConversationsListScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  
  const [conversations, setConversations] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});
  
  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);
  
  // Refresh conversations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
      return () => {};
    }, [])
  );

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/private-messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Conversations:', data);
      setConversations(data);
      
      // Fetch user info for each conversation
      for (const userId of data) {
        fetchUserInfo(userId);
      }
      
      // Fetch unread counts
      fetchUnreadCounts();
    } catch (e) {
      console.error('Error fetching conversations:', e);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread message counts
  const fetchUnreadCounts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/private-messages/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUnreadMessageCounts(data);
      }
    } catch (e) {
      console.error('Error fetching unread counts:', e);
    }
  };

  // Get user info
  const fetchUserInfo = async (userId) => {
    if (usersInfo[userId]) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json();
      const userInfo = {
        id: userId,
        name: data.nom || data.name || 'User',
        avatar: data.photo_de_profil || data.avatar || null,
        ...data
      };
      
      setUsersInfo(prev => ({ ...prev, [userId]: userInfo }));
    } catch (e) {
      console.error(`Error fetching user info for ${userId}:`, e);
      setUsersInfo(prev => ({ 
        ...prev, 
        [userId]: { id: userId, name: 'User', avatar: null }
      }));
    }
  };

  // Navigate to conversation screen
  const handleSelectConversation = (userId) => {
    navigation.navigate('Conversation', { userId });
  };

  // Render avatar component
  const renderAvatar = (user) => {
    if (!user) return <View style={styles.avatar} />;
    
    if (user.avatar) {
      return (
        <Image 
          source={{ uri: user.avatar }}
          style={styles.avatar}
          onError={(e) => {
            console.log("Avatar image failed to load, using placeholder");
          }}
        />
      );
    } else {
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
      );
    }
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim()
    ? conversations.filter(userId => {
        const user = usersInfo[userId] || {};
        return user.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={themeColors.textPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={fetchConversations}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accentPrimary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses" size={80} color={themeColors.accentPrimary} style={styles.icon} />
          <Text style={styles.title}>No conversations yet</Text>
          <Text style={styles.description}>
            Start chatting with friends and colleagues
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.toString()}
          renderItem={({ item: userId }) => {
            const user = usersInfo[userId];
            const unreadCount = unreadMessageCounts[userId] || 0;
            
            return (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => handleSelectConversation(userId)}
              >
                {renderAvatar(user)}
                <View style={styles.conversationInfo}>
                  <Text style={styles.userName}>{user?.name || 'Loading...'}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    Tap to view conversation
                  </Text>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
      
      {/* New conversation button */}
      <TouchableOpacity
        style={styles.newConversationButton}
        onPress={() => navigation.navigate('NewConversation')}
      >
        <Ionicons name="add" size={24} color={themeColors.textOnAccent} />
      </TouchableOpacity>
    </View>
  );
};

export default ConversationsListScreen;

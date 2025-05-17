import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, TextInput, Image, 
  ActivityIndicator, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './NewConversationScreen.styles';
import { useTheme } from '../../theme/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.63:3000';

const NewConversationScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState(null);
  
  // Récupérer tous les utilisateurs
  useEffect(() => {
    fetchUsers();
    
    // Récupérer l'ID de l'utilisateur actuel depuis le token
    const getCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.id) {
            setCurrentUserId(payload.id);
          }
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    };
    
    getCurrentUserId();
  }, []);
  
  // Filtrer les utilisateurs à chaque changement de recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const userName = user.nom || user.name || '';
        return userName.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectUser = (userId) => {
    // Naviguer vers la conversation avec cet utilisateur
    navigation.navigate('Conversation', { userId });
  };
  
  const renderAvatar = (user) => {
    if (!user) return <View style={styles.avatar} />;
    
    if (user.photo_de_profil || user.avatar) {
      return (
        <Image 
          source={{ uri: user.photo_de_profil || user.avatar }}
          style={styles.avatar}
          onError={(e) => console.log("Avatar image failed to load")}
        />
      );
    } else {
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {(user.nom || user.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle conversation</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={themeColors.textSecondary} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={themeColors.textPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          clearButtonMode="while-editing"
        />
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={fetchUsers}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accentPrimary} />
          <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers.filter(user => user.id_utilisateur !== currentUserId)}
          keyExtractor={(item) => item.id_utilisateur.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur disponible"}
              </Text>
            </View>
          }
          renderItem={({ item: user }) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => handleSelectUser(user.id_utilisateur)}
            >
              {renderAvatar(user)}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.nom || user.name || 'Utilisateur'}</Text>
                {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default NewConversationScreen;

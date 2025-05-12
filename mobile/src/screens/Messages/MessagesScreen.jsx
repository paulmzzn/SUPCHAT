import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStyles } from './MessagesScreen.styles'; // Changed import
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme

const MessagesScreen = ({ navigation, route }) => {
  const { colors: themeColors } = useTheme(); // Use theme context
  const styles = getStyles(themeColors); // Get styles based on current theme

  const [unreadCount, setUnreadCount] = useState(route.params?.unreadCount || 0);

  // Simulation de messages non lus (pour démonstration)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simuler l'arrivée de nouveaux messages toutes les 5 secondes
      if (Math.random() > 0.5) {
        setUnreadCount(prev => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Mettre à jour les paramètres de route lorsque unreadCount change
  useEffect(() => {
    navigation.setParams({ unreadCount });
  }, [unreadCount, navigation]);

  // Réinitialiser le compteur lorsque l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      setUnreadCount(0);
      return () => {};
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      <View style={styles.content}>
        <Ionicons name="chatbubble-ellipses" size={80} color={themeColors.accentPrimary} style={styles.icon} />
        <Text style={styles.title}>Bienvenue dans Messages</Text>
        <Text style={styles.description}>
          Voici votre espace de discussion privée. Commencez une nouvelle conversation ou continuez celles en cours.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setUnreadCount(prev => prev + 1)}
        >
          <Text style={styles.buttonText}>Simuler un nouveau message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MessagesScreen;
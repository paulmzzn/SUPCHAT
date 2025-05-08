import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const MessagesScreen = ({ navigation, route }) => {
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
        <Ionicons name="chatbubble-ellipses" size={80} color="#9348B7" style={styles.icon} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E28',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 30, 40, 0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#9348B7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MessagesScreen;
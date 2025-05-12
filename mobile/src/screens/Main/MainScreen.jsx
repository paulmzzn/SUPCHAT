import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MainScreen = ({ navigation }) => {
  const [token, setToken] = useState(null);
  const [decodedToken, setDecodedToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the token from AsyncStorage when component mounts
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          
          // Decode the JWT token
          try {
            const payload = storedToken.split('.')[1];
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const decodedData = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));
            
            setDecodedToken(decodedData);
          } catch (error) {
            console.error('Error decoding token:', error);
            setDecodedToken({ error: 'Invalid token format' });
          }
        }
      } catch (error) {
        console.error('Failed to get token from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('email');
      
      // Use the root navigation reset pattern to go back to auth flow
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9348B7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue sur SUPCHAT</Text>
          <Text style={styles.subtitle}>
            Vous êtes maintenant connecté à l'application
          </Text>
          
          <View style={styles.tokenContainer}>
            <Text style={styles.sectionTitle}>Token JWT</Text>
            <View style={styles.tokenBox}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.tokenText}>{token || 'Aucun token trouvé'}</Text>
              </ScrollView>
            </View>
          </View>
          
          {decodedToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.sectionTitle}>Données du token</Text>
              <View style={styles.tokenBox}>
                {Object.entries(decodedToken).map(([key, value]) => (
                  <View key={key} style={styles.tokenRow}>
                    <Text style={styles.tokenKey}>{key}:</Text>
                    <Text style={styles.tokenValue}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E28',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 40,
    textAlign: 'center',
  },
  tokenContainer: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  tokenBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenText: {
    color: '#9348B7',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  tokenRow: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  tokenKey: {
    color: '#9348B7',
    fontWeight: '600',
    marginRight: 6,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tokenValue: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#9348B7',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MainScreen;

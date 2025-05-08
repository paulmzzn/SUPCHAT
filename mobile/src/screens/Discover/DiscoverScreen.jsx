import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const DiscoverScreen = () => {
  // Données fictives pour les suggestions
  const suggestions = [
    { id: 1, name: 'Design Community', members: 1245, image: null },
    { id: 2, name: 'Dev Hub', members: 3678, image: null },
    { id: 3, name: 'Marketing Experts', members: 872, image: null },
    { id: 4, name: 'Product Management', members: 1543, image: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Découvrir</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.bannerSection}>
          <View style={styles.banner}>
            <FontAwesome name="compass" size={32} color="#fff" style={styles.bannerIcon} />
            <Text style={styles.bannerTitle}>Explorez des communautés</Text>
            <Text style={styles.bannerText}>
              Découvrez de nouveaux espaces de travail et rejoignez des communautés qui vous intéressent
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Suggestions pour vous</Text>
        
        <View style={styles.suggestionsSection}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity key={suggestion.id} style={styles.suggestionItem}>
              <View style={styles.suggestionIcon}>
                {suggestion.image ? (
                  <Image source={{ uri: suggestion.image }} style={styles.suggestionImage} />
                ) : (
                  <Text style={styles.suggestionInitial}>{suggestion.name.charAt(0)}</Text>
                )}
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>{suggestion.name}</Text>
                <Text style={styles.suggestionMembers}>{suggestion.members} membres</Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Rejoindre</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.searchSection}>
          <FontAwesome name="search" size={60} color="#9348B7" style={styles.searchIcon} />
          <Text style={styles.searchTitle}>Rechercher des espaces</Text>
          <Text style={styles.searchDescription}>
            Utilisez la recherche pour trouver des espaces de travail spécifiques ou parcourez les catégories populaires
          </Text>
          
          <TouchableOpacity style={styles.searchButton}>
            <FontAwesome name="search" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.searchButtonText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bannerSection: {
    marginBottom: 30,
  },
  banner: {
    backgroundColor: 'rgba(147, 72, 183, 0.2)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 72, 183, 0.3)',
  },
  bannerIcon: {
    marginBottom: 15,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  bannerText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  suggestionsSection: {
    marginBottom: 30,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(50, 50, 70, 0.3)',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  suggestionIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#B05FDF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  suggestionImage: {
    width: 45,
    height: 45,
    borderRadius: 10,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionMembers: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  joinButton: {
    backgroundColor: '#9348B7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchSection: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  searchIcon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  searchDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  searchButton: {
    backgroundColor: '#9348B7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default DiscoverScreen;
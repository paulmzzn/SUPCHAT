import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getStyles } from './DiscoverScreen.styles';
import { useTheme } from '../../theme/ThemeContext';

const DiscoverScreen = () => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

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
            <FontAwesome name="compass" size={32} color={themeColors.textPrimary} style={styles.bannerIcon} />
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
          <FontAwesome name="search" size={60} color={themeColors.accentPrimary} style={styles.searchIcon} />
          <Text style={styles.searchTitle}>Rechercher des espaces</Text>
          <Text style={styles.searchDescription}>
            Utilisez la recherche pour trouver des espaces de travail spécifiques ou parcourez les catégories populaires
          </Text>
          
          <TouchableOpacity style={styles.searchButton}>
            <FontAwesome name="search" size={16} color={themeColors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.searchButtonText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DiscoverScreen;
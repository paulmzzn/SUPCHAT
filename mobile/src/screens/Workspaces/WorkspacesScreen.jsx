import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getStyles } from './WorkspacesScreen.styles'; // Changed import
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme

const WorkspacesScreen = () => {
  const { colors: themeColors } = useTheme(); // Use theme context
  const styles = getStyles(themeColors); // Get styles based on current theme

  // Données fictives pour les espaces de travail
  const workspaces = [
    { id: 1, name: 'SUPCHAT Team', unread: 3 },
    { id: 2, name: 'Projet Mobile', unread: 0 },
    { id: 3, name: 'Design UI/UX', unread: 2 },
    { id: 4, name: 'Marketing', unread: 0 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Espaces de travail</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.workspacesSection}>
          {workspaces.map((workspace) => (
            <View key={workspace.id} style={styles.workspaceItem}>
              <View style={styles.workspaceIcon}>
                <Text style={styles.workspaceInitial}>{workspace.name.charAt(0)}</Text>
              </View>
              <View style={styles.workspaceInfo}>
                <Text style={styles.workspaceName}>{workspace.name}</Text>
                <Text style={styles.workspaceMembers}>8 membres</Text>
              </View>
              {workspace.unread > 0 && (
                <View style={styles.workspaceBadge}>
                  <Text style={styles.workspaceBadgeText}>{workspace.unread}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.emptyState}>
          <MaterialIcons name="workspaces" size={80} color={themeColors.accentPrimary} style={styles.icon} />
          <Text style={styles.title}>Vos espaces de travail</Text>
          <Text style={styles.description}>
            Collaborez avec votre équipe grâce aux espaces de travail. Créez des canaux et partagez vos idées.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkspacesScreen;
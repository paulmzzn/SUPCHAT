import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const WorkspacesScreen = () => {
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
          <MaterialIcons name="workspaces" size={80} color="#9348B7" style={styles.icon} />
          <Text style={styles.title}>Vos espaces de travail</Text>
          <Text style={styles.description}>
            Collaborez avec votre équipe grâce aux espaces de travail. Créez des canaux et partagez vos idées.
          </Text>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
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
  },
  workspacesSection: {
    marginBottom: 30,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
  workspaceIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#9348B7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workspaceInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workspaceMembers: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  workspaceBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  workspaceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 20,
  },
  icon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default WorkspacesScreen;
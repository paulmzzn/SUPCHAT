import { StyleSheet } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primaryBackground,
  },
  
  loadingText: {
    color: theme.textPrimary,
    fontSize: 16,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
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
    color: theme.textPrimary,
  },
  
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  
  headerContent: {
    flex: 1,
  },
  
  workspaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 8,
    marginLeft: 8,
  },
  
  // Nouveau style pour le badge de notification sur les paramètres
  settingsNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.primaryBackground,
  },
  settingsNotificationText: {
    color: theme.textOnAccent,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  content: {
    flex: 1,
  },
  
  // Workspace Info Card
  workspaceInfo: {
    backgroundColor: theme.cardBackground,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  workspaceAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  workspaceAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textOnAccent,
  },
  
  workspaceDetails: {
    flex: 1,
  },
  
  workspaceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  
  workspaceDescription: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  
  workspaceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accentPrimary,
  },
  
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.borderColor,
  },
  
  // Channels Section
  channelsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  
  addButton: {
    padding: 8,
  },
  
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.secondaryCardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  
  channelIcon: {
    marginRight: 12,
  },
  
  hashtagIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  channelContent: {
    flex: 1,
  },
  
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  
  channelMemberCount: {
    fontSize: 12,
    color: theme.accentPrimary,
  },
  
  channelDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  // Badge de notification pour les canaux
  channelBadge: {
    backgroundColor: theme.accentPrimary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },

  channelBadgeText: {
    color: theme.textOnAccent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyStateText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
  },

  // Bouton de recherche dans le header
  searchButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },

  // Styles pour la modal de recherche
  searchModal: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },

  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  searchModalCloseButton: {
    padding: 8,
    marginRight: 12,
  },

  searchModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    flex: 1,
  },

  searchInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryBackground,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    paddingVertical: 0,
  },

  searchSpinner: {
    marginLeft: 8,
  },

  // Onglets de recherche
  searchTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  searchTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: theme.primaryBackground,
  },

  searchTabActive: {
    backgroundColor: theme.accentPrimary + '20',
  },

  searchTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginLeft: 6,
  },

  searchTabTextActive: {
    color: theme.accentPrimary,
  },

  // Résultats de recherche
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },

  searchEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  searchEmptyText: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },

  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  searchResultIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  searchResultHashtag: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textSecondary,
  },

  searchResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  searchResultAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchResultAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  searchResultContent: {
    flex: 1,
    justifyContent: 'center',
  },

  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },

  searchResultSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },

  searchMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  searchMessageChannel: {
    fontSize: 14,
    color: theme.accentPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },

  searchMessageDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
});
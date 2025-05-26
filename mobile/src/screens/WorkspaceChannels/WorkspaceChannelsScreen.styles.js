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
    padding: 8,
    marginLeft: 8,
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
});
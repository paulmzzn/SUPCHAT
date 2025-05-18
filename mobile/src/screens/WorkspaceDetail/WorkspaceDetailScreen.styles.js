import { StyleSheet } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // États de chargement et d'erreur
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textPrimary,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: theme.accentPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  backButtonText: {
    color: theme.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },

  // En-tête du workspace
  workspaceHeader: {
    backgroundColor: theme.cardBackground,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 15,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: 120,
  },
  workspaceInfo: {
    padding: 15,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: -40,
    marginBottom: 10,
    alignItems: 'center',
  },
  workspaceIcon: {
    width: 80,
    height: 80,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: theme.cardBackground,
  },
  placeholderIcon: {
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.textOnAccent,
    fontSize: 36,
    fontWeight: 'bold',
  },
  workspaceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  workspaceDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.success,
  },
  
  // Sections et canaux
  sectionContainer: {
    marginTop: 20,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  channelsList: {
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  channelIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
    marginBottom: channel => channel.description ? 3 : 0,
  },
  channelDescription: {
    fontSize: 13,
    color: theme.textMuted,
  },
  unreadBadge: {
    backgroundColor: theme.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: theme.textOnAccent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyChannelsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyChannelsText: {
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});
import { StyleSheet } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
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
  // Ajout des styles pour la recherche
  searchIconButton: {
    padding: 8,
  },
  createWorkspaceButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  searchInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
    paddingVertical: 10,
  },
  clearSearchButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 15,
    marginTop: 10,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80, // Espace supplémentaire en bas pour la barre de navigation
  },
  workspacesSection: {
    marginBottom: 30,
  },
  
  // Styles alignés exactement avec DiscoverScreen
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.secondaryCardBackground,
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
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  suggestionImage: {
    width: 45,
    height: 45,
    borderRadius: 10,
  },
  suggestionInitial: {
    color: theme.textOnAccent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionMembers: {
    color: theme.textMuted,
    fontSize: 13,
  },
  
  // Badge pour notifier des messages non lus
  workspaceBadge: {
    backgroundColor: theme.danger,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    marginLeft: 8,
  },
  workspaceBadgeText: {
    color: theme.textOnAccent,
    fontWeight: 'bold',
    fontSize: 12,
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
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.accentPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: theme.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // État vide (aucun workspace)
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
    color: theme.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  discoverButton: {
    backgroundColor: theme.accentPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverButtonText: {
    color: theme.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
});

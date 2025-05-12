import { StyleSheet } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  header: {
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
  workspaceIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workspaceInitial: {
    color: theme.textOnAccent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workspaceMembers: {
    color: theme.textMuted,
    fontSize: 13,
  },
  workspaceBadge: {
    backgroundColor: theme.danger,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  workspaceBadgeText: {
    color: theme.textPrimary,
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
    color: theme.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

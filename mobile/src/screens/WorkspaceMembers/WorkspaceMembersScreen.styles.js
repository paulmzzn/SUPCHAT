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
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  
  headerAction: {
    alignItems: 'flex-end',
  },
  
  memberCount: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },
  
  membersList: {
    paddingVertical: 8,
  },
  
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
    backgroundColor: theme.primaryBackground,
  },
  
  memberContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.cardBackground,
  },
  
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  memberAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textOnAccent,
  },
  
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.primaryBackground,
  },
  
  memberInfo: {
    flex: 1,
  },
  
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  
  memberRole: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 6,
  },
  
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  memberStatus: {
    fontSize: 12,
    color: theme.textMuted,
  },
  
  memberEmail: {
    fontSize: 12,
    color: theme.textMuted,
  },
  
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  
  // Styles pour les états de statut
  statusOnline: {
    backgroundColor: '#4cd964',
  },
  
  statusAway: {
    backgroundColor: '#ffb300',
  },
  
  statusDnd: {
    backgroundColor: '#f44336',
  },
  
  statusOffline: {
    backgroundColor: theme.textMuted,
  },
});
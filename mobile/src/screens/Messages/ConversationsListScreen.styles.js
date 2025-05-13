import { StyleSheet, Platform } from 'react-native';

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
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  newConversationHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: theme.textPrimary,
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
    opacity: 1,
    transform: [{translateY: 0}],
    transition: 'transform 0.3s ease, opacity 0.3s ease',
  },
  activeConversation: {
    backgroundColor: `${theme.accentPrimary}15`,
  },
  newConversation: {
    opacity: 0,
    transform: [{translateY: -20}],
    animationName: 'fadeInDown',
    animationDuration: '300ms',
    animationFillMode: 'forwards',
  },
  conversationMoving: {
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    zIndex: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.cardBackground,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textOnAccent,
  },
  conversationInfo: {
    flex: 1,
    paddingLeft: 15,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  unreadLastMessage: {
    fontWeight: '600',
    color: theme.textPrimary,
  },
  newLastMessage: {
    fontStyle: 'italic',
    color: theme.accentSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.accentPrimary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
  },
  unreadCount: {
    color: theme.textOnAccent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: theme.accentPrimary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: theme.textOnAccent,
    fontWeight: 'bold',
    fontSize: 16,
  },
  contextMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  modernContextMenu: {
    position: 'absolute',
    width: 220,
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: theme.borderColor,
    zIndex: 1001,
    marginRight: 20, // Augmenté pour plus d'espace à droite
  },
  contextMenuContainer: {
    width: '80%',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  deleteMenuItem: {
    marginRight: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.05)', // Léger fond rouge
    borderRadius: 8,
  },
  contextMenuItemText: {
    fontSize: 16,
    color: theme.textPrimary,
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
    paddingRight: 12, // Plus d'espace à droite du texte
  },
});

export const animations = `
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

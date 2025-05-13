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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  content: {
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
  
  // Conversation list styles
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
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

  // Error and loading states
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

  // Chat view styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
    paddingTop: 50,
    zIndex: 10,
  },
  chatHeaderActive: {
    backgroundColor: Platform.OS === 'ios' ? 
      theme.borderColor : theme.cardBackground, // Léger changement de couleur sur iOS
  },
  backButton: {
    marginRight: 15,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.textPrimary,
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    paddingBottom: 10,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '85%',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  ownMessage: {
    backgroundColor: theme.accentPrimary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#E0E0E0', // Gray color for received messages
    borderBottomLeftRadius: 4,
  },
  ownMessageText: {
    fontSize: 16,
    color: '#FFFFFF', // White text for sent messages (purple bubbles)
  },
  otherMessageText: {
    fontSize: 16,
    color: '#000000', // Black text for received messages (gray bubbles)
  },
  messageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  ownMessageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white for time in sent messages
    marginRight: 5,
  },
  otherMessageTime: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black for time in received messages
  },
  readStatusInBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  readStatusText: {
    fontSize: 11,
    marginLeft: 2,
    color: 'rgba(255, 255, 255, 0.9)', // Presque blanc pour message lu
    fontWeight: '500',
  },
  sentStatusText: {
    fontSize: 11,
    marginLeft: 2,
    color: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white pour message envoyé
  },
  readStatus: {
    alignSelf: 'flex-end',
    marginLeft: 5,
    marginBottom: 5,
  },

  // Empty messages state
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Input area
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 5, // Reduced padding
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 80, // Reduced from 100
    minHeight: 36, // Reduced from 40
    color: theme.textPrimary,
  },
  sendButton: {
    backgroundColor: theme.accentPrimary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: theme.disabledButton,
    opacity: 0.5,
  },
});

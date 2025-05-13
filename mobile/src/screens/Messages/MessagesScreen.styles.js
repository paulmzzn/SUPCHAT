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
    willChange: 'transform', // Optimisation des performances
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '85%',
    opacity: 1,
    transform: [{translateY: 0}, {scale: 1}],
  },
  animatingMessage: {
    animationName: 'messageAppear',
    animationDuration: '300ms',
    animationFillMode: 'backwards',
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

  // Add these new styles for pagination
  loadingMoreContainer: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingMoreText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginLeft: 10,
  },
  noMoreMessagesContainer: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMoreMessagesText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Add these new styles for attachments
  attachmentsContainer: {
    marginTop: 8,
    width: '100%',
  },
  imageAttachment: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: theme.cardBackground,
    // Ajout d'une bordure pour rendre les images plus visibles
    borderWidth: 1,
    borderColor: theme.borderColor,
    // Ajout d'une ombre pour donner du relief
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  attachmentImage: {
    width: '100%', 
    height: 200, // Augmenté pour une meilleure visibilité
    borderRadius: 8,
    // Ajout d'un background pour voir les dimensions pendant le chargement
    backgroundColor: `${theme.accentPrimary}10`,
  },
  imageCaption: {
    fontSize: 12,
    color: theme.textSecondary,
    padding: 4,
    textAlign: 'center',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    // Ajout d'effets visuels pour rendre plus visible qu'il est cliquable
    borderWidth: 1,
    borderColor: theme.borderColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${theme.accentPrimary}20`,
    marginRight: 10,
  },
  fileDetails: {
    flex: 1,
    paddingRight: 8,
  },
  fileName: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: theme.textSecondary,
  },

  // Styles pour la gestion des erreurs d'images
  placeholderImageContainer: {
    width: '100%', 
    height: 200,
    backgroundColor: `${theme.accentPrimary}10`,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderStyle: 'dashed',
  },
  placeholderImageText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Completely revised preview modal styles for better visibility and interaction
  previewFullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  previewContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#121212',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  previewCloseButton: {
    padding: 5,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  previewImageContainer: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  previewFileText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  previewFileName: {
    color: '#CCC',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  previewDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accentPrimary,
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  downloadIcon: {
    marginRight: 8,
  },
  previewDownloadText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Add modal preview styles
  previewModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9990,
  },
  previewModalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10000,
  },
  previewModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  previewModalCloseButton: {
    padding: 10,
  },
  previewModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  imagePreviewContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalImage: {
    width: '100%',
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  pdfPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  pdfPreviewText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  videoPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  videoPreviewText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  genericPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  genericPreviewText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    marginBottom: 5,
  },
  genericPreviewSubText: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 10,
    maxWidth: '80%',
    textAlign: 'center',
  },
  genericPreviewFileType: {
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
    fontStyle: 'italic'
  },
  downloadButton: {
    backgroundColor: theme.accentPrimary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Définir les animations pour React Native
export const messageAnimations = `
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

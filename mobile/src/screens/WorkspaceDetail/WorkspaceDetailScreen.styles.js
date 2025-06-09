import { StyleSheet, Dimensions } from 'react-native';

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

  activeChannelName: {
    fontSize: 14,
    color: theme.accentPrimary,
    marginTop: 2,
  },

  headerAction: {
    padding: 8,
    marginLeft: 8,
  },

  // Messages
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },

  messagesContent: {
    paddingVertical: 10,
    flexGrow: 1,
  },

  // Loading more messages - simplified and cleaner
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: theme.primaryBackground,
  },
  
  loadingMoreText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  
  endOfMessagesContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryBackground,
  },
  
  endOfMessagesText: {
    color: theme.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  messageContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 1,
    borderRadius: 15,
    flexShrink: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  firstMessage: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },

  lastMessage: {
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 4,
  },

  ownMessage: {
    backgroundColor: theme.accentPrimary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },

  otherMessage: {
    backgroundColor: '#E0E0E0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },

  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  // Header dans la bulle pour les autres utilisateurs
  messageHeaderInBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 180, // Force une largeur minimale pour contenir avatar + nom + heure
  },

  messageHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 0, // Supprimé paddingRight
  },

  messageAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginRight: 12, // Espace entre nom et heure
  },

  messageTime: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '500',
    minWidth: 40, // Largeur minimale pour l'heure (ex: "14:30")
    textAlign: 'right',
  },

  ownMessageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    textAlign: 'right',
    fontWeight: '500',
  },

  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
  },

  ownMessageText: {
    color: '#FFFFFF',
  },

  otherMessageText: {
    color: '#000000',
  },

  // Message groups
  messageGroupContainer: {
    marginVertical: 2,
  },

  ownMessageGroup: {
    alignSelf: 'flex-end',
    marginLeft: '15%',
    maxWidth: '85%',
  },

  otherMessageGroup: {
    alignSelf: 'flex-start',
    marginRight: '15%',
    maxWidth: '85%',
  },

  // Avatar styles
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.cardBackground,
  },

  // Avatar styles - plus petit pour être dans la bulle
  avatarInBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
    marginRight: 8,
  },

  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarPlaceholderInBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.textOnAccent,
  },

  avatarTextInBubble: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.textOnAccent,
  },

  // Connection error
  connectionErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.errorBackground || '#FFE5E5',
    borderBottomWidth: 1,
    borderBottomColor: theme.errorBorder || '#FFB3B3',
  },

  connectionErrorText: {
    color: theme.errorText || '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 12,
  },

  retryButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: theme.errorText || '#D32F2F',
    borderRadius: 12,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: theme.primaryBackground,
  },

  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.accentPrimary,
    marginHorizontal: 1,
  },

  typingDot1: {
    animationName: 'bounce',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationDelay: '0s',
  },

  typingDot2: {
    animationName: 'bounce',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationDelay: '0.2s',
  },

  typingDot3: {
    animationName: 'bounce',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationDelay: '0.4s',
  },

  typingText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },

  // Input - enhanced styling
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },

  attachmentButton: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  messageInput: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 80,
    minHeight: 36,
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

  // Styles pour les fichiers
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 10,
  },

  fileDetails: {
    flex: 1,
    paddingRight: 8,
  },

  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },

  fileSize: {
    fontSize: 12,
    opacity: 0.7,
  },

  // Styles pour les images
  imageAttachment: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
    position: 'relative',
    maxWidth: 280,
    minWidth: 150,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  imagePreview: {
    width: '100%',
    minHeight: 120,
    maxHeight: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageCaptionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  imageCaption: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Styles pour la boîte à outils
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  toolboxModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  toolboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },

  toolboxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },

  toolboxCloseButton: {
    padding: 4,
  },

  toolboxContent: {
    padding: 20,
  },

  toolboxSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
    marginTop: 8,
    paddingLeft: 4,
  },

  toolboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: theme.primaryBackground,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },

  toolboxOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentSecondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  toolboxOptionContent: {
    flex: 1,
    paddingRight: 8,
  },

  toolboxOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },

  toolboxOptionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  // Styles pour les actions du header
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },

  videoCallButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: theme.accentPrimary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.accentPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },

  // STYLES POUR LES MESSAGES SYSTÈME
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },

  systemMessageBubble: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)', // Fond jaune/ambre très léger
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)', // Bordure ambre
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '90%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  systemMessageText: {
    fontSize: 14,
    color: '#B7950B', // Couleur ambre/dorée pour le texte
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Styles pour le menu contextuel
  contextMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  contextMenu: {
    position: 'absolute',
    width: 180,
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1001,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 1,
  },
  deleteMenuItem: {
    marginTop: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.05)', // Light red background
  },
  contextMenuItemText: {
    fontSize: 16,
    color: theme.textPrimary,
    marginLeft: 10,
  },

  // Styles pour le sélecteur d'emoji
  emojiPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPicker: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 15,
    width: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1001,
  },
  emojiScrollView: {
    flexGrow: 0,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  emojiText: {
    fontSize: 24,
  },

  // Styles pour l'édition de message
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    width: '90%',
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 15,
  },
  editInput: {
    backgroundColor: theme.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 80,
    color: theme.textPrimary,
    fontSize: 16,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: theme.disabledButton,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.accentPrimary,
  },
  saveButtonText: {
    color: theme.textOnAccent,
    fontWeight: '600',
  },

  // Styles pour les réactions sur les messages
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    alignItems: 'center',
  },
  userReactedBubble: {
    backgroundColor: `${theme.accentPrimary}30`, // Semi-transparent accent color
    borderWidth: 1,
    borderColor: theme.accentPrimary,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 3,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // Styles pour les réponses aux messages
  replyContainer: {
    backgroundColor: `${theme.accentPrimary}15`,
    borderLeftWidth: 3,
    borderLeftColor: theme.accentPrimary,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    borderRadius: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  replyContent: {
    flex: 1,
    paddingRight: 10,
  },
  replyText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  replyMessage: {
    color: theme.textSecondary,
    fontSize: 13,
    opacity: 0.8,
  },
  replyCloseButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Styles pour l'affichage des réponses dans les messages
  messageReplyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: theme.accentPrimary,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  
  replyIndicator: {
    width: 2,
    backgroundColor: theme.accentPrimary,
    marginRight: 8,
    alignSelf: 'stretch',
  },
  
  replyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  messageReplyText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accentPrimary,
    marginLeft: 4,
    flex: 1,
  },
  
  messageReplyContent: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.textSecondary,
    marginTop: 2,
    paddingLeft: 16,
  },
});

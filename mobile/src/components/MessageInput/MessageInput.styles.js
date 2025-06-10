import { StyleSheet, Platform } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 10,
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
    zIndex: 10,
  },
  
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  
  // Reply container styles
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
});
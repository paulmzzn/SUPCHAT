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

  backButton: {
    padding: 8,
    marginRight: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    flex: 1,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40, // Pour équilibrer avec le bouton retour
  },

  scrollContainer: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 120, // Espace pour le bouton fixe en bas
  },

  formSection: {
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.borderColor,
    minHeight: 48,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  inputHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },

  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },

  switchInfo: {
    flex: 1,
    paddingRight: 16,
  },

  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },

  switchDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },

  infoSection: {
    marginTop: 20,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderLeftWidth: 4,
    borderLeftColor: theme.accentPrimary,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginLeft: 12,
  },

  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },

  createButton: {
    backgroundColor: theme.accentPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  createButtonDisabled: {
    backgroundColor: theme.disabledButton,
    opacity: 0.6,
  },

  createButtonText: {
    color: theme.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Styles pour l'upload d'images
  imageUploadContainer: {
    marginBottom: 8,
  },

  imageUploadButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.accentPrimary,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },

  bannerUploadButton: {
    minHeight: 120,
  },

  imageUploadText: {
    color: theme.accentPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },

  iconPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
  },

  bannerPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
  },

  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.danger,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
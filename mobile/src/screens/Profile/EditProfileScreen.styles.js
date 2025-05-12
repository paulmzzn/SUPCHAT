import { StyleSheet, Platform } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40, // Adjust for status bar
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: theme.accentBorder,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderText: {
    color: theme.textOnAccent,
    fontSize: 50,
    fontWeight: 'bold',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: theme.secondaryCardBackground,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  changeAvatarText: {
    color: theme.textPrimary,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    paddingHorizontal: 15,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: theme.accentPrimary,
    backgroundColor: theme.accentFocusedBackground,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: theme.accentPrimary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  saveButtonText: {
    color: theme.textOnAccent,
    fontSize: 17,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primaryBackground,
  },
  errorText: {
    color: theme.danger,
    textAlign: 'center',
    marginBottom: 15,
  },
});

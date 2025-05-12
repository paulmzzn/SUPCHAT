import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const getStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width > 380 ? 24 : 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  headerRight: {
    width: 40, // to balance the back button
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: width > 320 ? 28 : 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: width > 380 ? 20 : 16,
  },
  inputLabel: {
    color: theme.textPrimary,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: Platform.OS === 'ios' ? 54 : 56,
  },
  inputContainerFilled: {
    borderColor: theme.accentPrimary,
    backgroundColor: theme.accentFocusedBackground,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
    padding: 0,
  },
  passwordToggle: {
    padding: 10,
    marginRight: -5,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeInput: {
    width: width < 380 ? (width - (width > 380 ? 48 : 32) - 5*5) / 6 : 45, // Adjust based on paddingHorizontal and spacing
    height: width < 380 ? 50 : 56,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    color: theme.textPrimary,
    fontSize: 20,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: theme.accentPrimary,
    backgroundColor: theme.accentFocusedBackground,
  },
  actionButton: {
    backgroundColor: theme.accentPrimary,
    height: Platform.OS === 'ios' ? 54 : 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: theme.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: theme.accentPrimary,
    opacity: 0.5,
  },
  actionButtonText: {
    color: theme.textOnAccent, // Updated
    fontSize: 17,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: theme.successBackground, // Assuming this is for success messages
    borderRadius: 8,
    padding: 12,
    marginTop: 0,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: theme.successBorder,
  },
  messageText: {
    color: theme.successText,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: theme.errorBackground,
    borderRadius: 8,
    padding: 12,
    marginTop: 0,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: theme.errorBorder,
  },
  errorText: {
    color: theme.errorText,
    fontSize: 14,
  },
  glowCircleTop: {
    position: 'absolute',
    width: 420,
    height: 400,
    borderRadius: 225,
    backgroundColor: theme.accentPrimary,
    top: -100,
    right: -50,
    opacity: parseFloat(theme.glowEffect.split(',')[3]) || 0.05,
    zIndex: -1,
  },
  glowCircleBottom: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: theme.accentPrimary,
    bottom: -200,
    left: -100,
    opacity: parseFloat(theme.glowEffect.split(',')[3]) || 0.05,
    zIndex: -1,
  },
});

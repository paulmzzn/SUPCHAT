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
  dismissKeyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 30,
    marginBottom: 60,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  dot: {
    color: theme.accentPrimary,
  },
  formContainer: {
    width: '100%',
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  subHeadline: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: theme.textPrimary,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    color: theme.accentPrimary,
    fontSize: 15,
    fontWeight: '500',
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 58,
  },
  inputContainerFilled: {
    borderColor: theme.accentPrimary,
    backgroundColor: theme.accentFocusedBackground,
  },
  inputIcon: {
    marginRight: 12,
    // color will be passed directly to Ionicons component
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  passwordToggle: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: theme.accentPrimary,
    height: 58,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: {
    backgroundColor: theme.accentPrimary,
    opacity: 0.5,
  },
  loginButtonText: {
    color: theme.textOnAccent, // Updated
    fontSize: 17,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.inputBorder,
  },
  orText: {
    color: theme.textMuted,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  socialIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  socialButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    padding: 10,
  },
  registerText: {
    color: theme.textMuted,
    fontSize: 15,
    marginRight: 5,
  },
  registerLink: {
    color: theme.accentPrimary,
    fontSize: 15,
    fontWeight: '600',
    padding: 5,
  },
  glowCircleTop: {
    position: 'absolute',
    width: 420,
    height: 400,
    borderRadius: 225,
    backgroundColor: theme.accentPrimary,
    top: -100,
    right: -50,
    opacity: parseFloat(theme.glowEffect.split(',')[3]) || 0.05, // Extract opacity
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
    opacity: parseFloat(theme.glowEffect.split(',')[3]) || 0.05, // Extract opacity
    zIndex: -1,
  },
  errorContainer: {
    backgroundColor: theme.errorBackground,
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.errorBorder,
  },
  errorText: {
    color: theme.errorText,
    fontSize: 14,
  },
});

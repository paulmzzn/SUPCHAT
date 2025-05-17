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
    width: 40,
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
    padding: 0, // Ensure no extra padding inside TextInput
  },
  passwordToggle: {
    padding: 10, // Increase touch target
    marginRight: -5, // Counteract padding for alignment
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
  },
  datePickerTextFilled: {
    color: theme.textPrimary,
  },
  datePickerTextPlaceholder: {
    color: theme.textPlaceholder,
  },
  registerButton: {
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
  registerButtonText: {
    color: theme.textOnAccent, // Updated
    fontSize: 17,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: (width - (width > 380 ? 48 : 32) ) / 2 - 8, // Adjust based on paddingHorizontal of scrollContent
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    padding: 8,
  },
  loginText: {
    color: theme.textMuted,
    fontSize: 15,
    marginRight: 5,
  },
  loginLink: {
    color: theme.accentPrimary,
    fontSize: 15,
    fontWeight: '600',
    padding: 4,
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

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
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  dot: {
    color: theme.accentPrimary,
  },
  card: {
    backgroundColor: theme.themeMode === 'dark' ? 'rgba(19, 19, 22, 0.6)' : theme.secondaryCardBackground, // Adjusted for light theme
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInput: {
    width: width < 380 ? (width - 80) / 6 - 5 : 45, // Adjusted for padding
    height: width < 380 ? 50 : 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    fontSize: 22,
    color: theme.textPrimary,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: theme.accentPrimary,
    backgroundColor: theme.accentFocusedBackground,
  },
  verifyButton: {
    backgroundColor: theme.accentPrimary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonText: {
    color: theme.textOnAccent, // Updated
    fontSize: 17,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  resendText: {
    color: theme.textMuted,
    fontSize: 15,
    marginRight: 5,
  },
  resendButton: {
    color: theme.accentPrimary,
    fontSize: 15,
    fontWeight: '600',
    padding: 4,
  },
  errorContainer: {
    backgroundColor: theme.errorBackground,
    borderRadius: 8,
    padding: 12,
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

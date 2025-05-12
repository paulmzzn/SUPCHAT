import { StyleSheet } from 'react-native';

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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bannerSection: {
    marginBottom: 30,
  },
  banner: {
    backgroundColor: theme.accentBackground,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  bannerIcon: {
    marginBottom: 15,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  bannerText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 15,
  },
  suggestionsSection: {
    marginBottom: 30,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.secondaryCardBackground,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  suggestionIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: theme.accentSecondary, // Lighter purple
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionInitial: {
    color: theme.textOnAccent, // Updated
    fontSize: 20,
    fontWeight: 'bold',
  },
  suggestionImage: {
    width: 45,
    height: 45,
    borderRadius: 10,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionMembers: {
    color: theme.textMuted,
    fontSize: 13,
  },
  joinButton: {
    backgroundColor: theme.accentPrimary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  joinButtonText: {
    color: theme.textOnAccent, // Updated
    fontSize: 13,
    fontWeight: '600',
  },
  searchSection: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  searchIcon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  searchDescription: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  searchButton: {
    backgroundColor: theme.accentPrimary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchButtonText: {
    color: theme.textOnAccent, // Updated
    fontSize: 16,
    fontWeight: 'bold',
  }
});

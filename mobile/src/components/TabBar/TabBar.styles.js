import { StyleSheet } from 'react-native';

export const getStyles = (theme) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    shadowColor: "#000", // Consider theming shadows
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
    height: 50,
  },
  iconContainer: {
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 20,
    height: 3,
    backgroundColor: theme.accentPrimary,
    borderRadius: 3,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: theme.danger,
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.badgeBorder,
  },
  badgeText: {
    color: theme.textOnAccent, // Updated
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

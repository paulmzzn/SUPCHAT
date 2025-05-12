export const colors = {
  dark: {
    primaryBackground: '#1E1E28',
    cardBackground: 'rgba(30, 30, 40, 0.97)', // Headers, TabBar
    secondaryCardBackground: 'rgba(50, 50, 70, 0.3)', // Settings cards, list items
    
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.6)', // For less prominent text like members count
    textPlaceholder: 'rgba(255, 255, 255, 0.4)',
    textOnAccent: '#FFFFFF', // Added for text on accent backgrounds
    
    accentPrimary: '#9348B7', // Main purple
    accentSecondary: '#B05FDF', // Lighter purple for icons, suggestion icons
    accentBackground: 'rgba(147, 72, 183, 0.2)', // Banners, edit profile button bg
    accentBorder: 'rgba(147, 72, 183, 0.3)', // Banner border
    accentFocusedBackground: 'rgba(147, 72, 183, 0.08)', // Input focus bg

    borderColor: 'rgba(255, 255, 255, 0.05)', // Header borders, dividers
    inputBorder: 'rgba(255,255,255,0.3)',
    inputBackground: 'rgba(255, 255, 255, 0.05)',

    switchTrackFalse: '#3A3A50',
    switchTrackTrue: 'rgba(147, 72, 183, 0.6)',
    switchThumbFalse: '#f4f3f4', // Standard light thumb
    switchThumbTrue: '#9348B7',

    danger: '#e74c3c', // Red for badges or errors
    dangerBackground: 'rgba(231, 76, 60, 0.2)', // Logout button bg
    dangerBorder: 'rgba(231, 76, 60, 0.5)', // Logout button border
    errorBackground: 'rgba(255, 87, 87, 0.15)',
    errorBorder: '#FF5757',
    errorText: '#FF9494',

    successBackground: 'rgba(72, 183, 147, 0.15)',
    successBorder: '#48B793',
    successText: '#94FFDD',
    
    badgeBorder: 'rgba(30, 30, 40, 1)', // TabBar badge border
    glowEffect: 'rgba(147, 72, 183, 0.05)', // For background glows
  },
  light: {
    primaryBackground: '#F0F2F5', // Light grey
    cardBackground: 'rgba(255, 255, 255, 0.98)', // Whiteish, slightly transparent
    secondaryCardBackground: '#FFFFFF', // Pure white for cards
    
    textPrimary: '#1C1E21', // Dark grey, almost black
    textSecondary: 'rgba(0, 0, 0, 0.65)',
    textMuted: 'rgba(0, 0, 0, 0.5)',
    textPlaceholder: 'rgba(0, 0, 0, 0.4)',
    textOnAccent: '#FFFFFF', // Added for text on accent backgrounds
    
    accentPrimary: '#9348B7',
    accentSecondary: '#B05FDF',
    accentBackground: 'rgba(147, 72, 183, 0.1)',
    accentBorder: 'rgba(147, 72, 183, 0.2)',
    accentFocusedBackground: 'rgba(147, 72, 183, 0.05)',

    borderColor: 'rgba(0, 0, 0, 0.1)', // Light grey border
    inputBorder: 'rgba(0,0,0,0.2)',
    inputBackground: '#FFFFFF',

    switchTrackFalse: '#DCDFE4',
    switchTrackTrue: 'rgba(147, 72, 183, 0.5)',
    switchThumbFalse: '#FFFFFF', // White thumb
    switchThumbTrue: '#9348B7',

    danger: '#e74c3c',
    dangerBackground: 'rgba(231, 76, 60, 0.1)',
    dangerBorder: 'rgba(231, 76, 60, 0.3)',
    errorBackground: 'rgba(255, 87, 87, 0.1)',
    errorBorder: '#e74c3c',
    errorText: '#D93025',

    successBackground: 'rgba(72, 183, 147, 0.1)',
    successBorder: '#48B793',
    successText: '#2A8F6E',
    
    badgeBorder: '#FFFFFF', // TabBar badge border
    glowEffect: 'rgba(147, 72, 183, 0.03)',
  },
};

import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const lightTheme = {
  primaryBackground: '#FFFFFF',
  secondaryBackground: '#F8F9FA',
  cardBackground: '#FFFFFF',
  secondaryCardBackground: '#F8F9FA',
  textPrimary: '#000000',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnAccent: '#FFFFFF',
  accentPrimary: '#3B82F6',
  borderColor: '#E5E7EB',
  inputBackground: '#FFFFFF',
  error: '#EF4444',
};

const darkTheme = {
  primaryBackground: '#181818',
  secondaryBackground: '#252525',
  cardBackground: '#1F1F1F',
  secondaryCardBackground: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnAccent: '#FFFFFF',
  accentPrimary: '#3B82F6',
  borderColor: '#374151',
  inputBackground: '#2A2A2A',
  error: '#EF4444',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === lightTheme ? darkTheme : lightTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
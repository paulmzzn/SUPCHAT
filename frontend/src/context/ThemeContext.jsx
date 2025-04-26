import React, { createContext, useContext, useEffect, useState } from 'react';

// Valeurs possibles : 'dark', 'light', 'system'
const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  // Applique la classe CSS sur le body
  useEffect(() => {
    const root = document.body;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
  }, [theme]);

  // Gère le thème système si choisi
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mq.matches) {
        document.body.classList.remove('theme-light');
      } else {
        document.body.classList.add('theme-light');
      }
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [theme]);

  // Sauvegarde le choix utilisateur
  const setTheme = (value) => {
    setThemeState(value);
    localStorage.setItem('theme', value);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

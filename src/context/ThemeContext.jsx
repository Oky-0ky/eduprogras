import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('eduprogress_theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else if (themeMode === 'high-contrast') {
      root.classList.add('high-contrast');
    }
    
    localStorage.setItem('eduprogress_theme', themeMode);
  }, [themeMode]);

  const toggleTheme = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

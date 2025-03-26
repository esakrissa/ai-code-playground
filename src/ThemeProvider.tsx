import React, { useState, useEffect, ReactNode } from 'react';
import { ThemeContext, ThemeMode, getThemeColors } from './themes';

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage if available, otherwise default to light
  const initialTheme: ThemeMode = (localStorage.getItem('theme') as ThemeMode) || 'light';
  const [mode, setMode] = useState<ThemeMode>(initialTheme);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Apply theme colors to body when theme changes
  useEffect(() => {
    const colors = getThemeColors(mode);
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.foreground;
  }, [mode]);

  return (
    <ThemeContext.Provider 
      value={{ 
        mode, 
        toggleTheme, 
        colors: getThemeColors(mode)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 
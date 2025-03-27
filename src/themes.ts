import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  border: string;
  codeBackground: string;
  editorBackground: string;
  editorText: string;
  errorBackground: string;
  errorBorder: string;
  sidebar: string;
  sidebarBorder: string;
  userMessage: string;
  aiMessage: string;
  inputBackground: string;
  isDark?: boolean;
}

export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  primary: '#0078d7',
  secondary: '#f0f0f0',
  background: '#ffffff',
  foreground: '#333333',
  border: '#dddddd',
  codeBackground: '#f9f9f9',
  editorBackground: '#ffffff',
  editorText: '#333333',
  errorBackground: '#fff0f0',
  errorBorder: '#ffcccc',
  sidebar: '#f8f8f8',
  sidebarBorder: '#e0e0e0',
  userMessage: '#e3f2fd',
  aiMessage: '#f5f5f5',
  inputBackground: '#ffffff',
  isDark: false,
};

const darkColors: ThemeColors = {
  primary: '#2196f3',
  secondary: '#333333',
  background: '#1a1a1a',
  foreground: '#e0e0e0',
  border: '#444444',
  codeBackground: '#252525',
  editorBackground: '#1e1e1e',
  editorText: '#e0e0e0',
  errorBackground: '#3c1f1f',
  errorBorder: '#5c2b2b',
  sidebar: '#252525',
  sidebarBorder: '#333333',
  userMessage: '#1e3a5a',
  aiMessage: '#2a2a2a',
  inputBackground: '#252525',
  isDark: true,
};

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'light' ? lightColors : darkColors;
};

// Default theme context
export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  colors: lightColors,
}); 
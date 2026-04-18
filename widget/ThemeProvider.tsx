import { createContext, useContext, ReactNode } from 'react';
import { WidgetTheme } from './types/widget';
import { useTheme } from './hooks/useTheme';

interface ThemeContextValue {
  theme: WidgetTheme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  applyTheme: () => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  theme: WidgetTheme;
  containerId?: string;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme,
  containerId,
  children,
}) => {
  const themeHook = useTheme({ theme, containerId });

  const contextValue: ThemeContextValue = {
    theme,
    isDarkMode: themeHook.isDarkMode,
    toggleDarkMode: themeHook.toggleDarkMode,
    applyTheme: themeHook.applyTheme,
    resetTheme: themeHook.resetTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

import { useEffect, useCallback, useState } from 'react';
import { WidgetTheme, ThemeVariables } from '../types/widget';

interface UseThemeOptions {
  theme: WidgetTheme;
  containerId?: string;
}

interface UseThemeReturn {
  themeVariables: ThemeVariables;
  applyTheme: () => void;
  resetTheme: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const defaultTheme: WidgetTheme = {
  mode: 'light',
  primaryColor: '#7c3aed',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderRadius: '8px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
};

export const useTheme = ({
  theme,
  containerId = 'okami-widget-container',
}: UseThemeOptions): UseThemeReturn => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appliedTheme, setAppliedTheme] = useState(theme);

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Generate theme variables
  const generateThemeVariables = useCallback((themeConfig: WidgetTheme, darkMode = false): ThemeVariables => {
    const baseTheme = { ...defaultTheme, ...themeConfig };

    let variables: ThemeVariables;

    if (darkMode) {
      // Dark mode adjustments
      variables = {
        '--widget-primary-color': baseTheme.primaryColor,
        '--widget-background-color': '#1f2937',
        '--widget-text-color': '#f9fafb',
        '--widget-border-radius': baseTheme.borderRadius,
        '--widget-font-family': baseTheme.fontFamily || defaultTheme.fontFamily,
        '--widget-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        '--widget-z-index': '1000',
      };
    } else {
      // Light mode
      variables = {
        '--widget-primary-color': baseTheme.primaryColor,
        '--widget-background-color': baseTheme.backgroundColor,
        '--widget-text-color': baseTheme.textColor,
        '--widget-border-radius': baseTheme.borderRadius,
        '--widget-font-family': baseTheme.fontFamily || defaultTheme.fontFamily,
        '--widget-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '--widget-z-index': '1000',
      };
    }

    return variables;
  }, []);

  const themeVariables = generateThemeVariables(appliedTheme, isDarkMode);

  // Apply theme to DOM
  const applyTheme = useCallback(() => {
    const container = document.getElementById(containerId);
    const targetElement = container || document.documentElement;

    // Set CSS custom properties
    Object.entries(themeVariables).forEach(([property, value]) => {
      targetElement.style.setProperty(property, value);
    });

    // Set theme data attribute for CSS selectors
    targetElement.setAttribute('data-widget-theme', isDarkMode ? 'dark' : 'light');

    // Add theme-specific classes
    targetElement.classList.add('okami-widget-themed');

    if (isDarkMode) {
      targetElement.classList.add('okami-widget-dark');
      targetElement.classList.remove('okami-widget-light');
    } else {
      targetElement.classList.add('okami-widget-light');
      targetElement.classList.remove('okami-widget-dark');
    }
  }, [containerId, themeVariables, isDarkMode]);

  // Reset theme
  const resetTheme = useCallback(() => {
    const container = document.getElementById(containerId);
    const targetElement = container || document.documentElement;

    // Remove CSS custom properties
    Object.keys(themeVariables).forEach((property) => {
      targetElement.style.removeProperty(property);
    });

    // Remove theme attributes and classes
    targetElement.removeAttribute('data-widget-theme');
    targetElement.classList.remove(
      'okami-widget-themed',
      'okami-widget-dark',
      'okami-widget-light'
    );
  }, [containerId, themeVariables]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Apply theme when theme or dark mode changes
  useEffect(() => {
    setAppliedTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyTheme();

    // Cleanup on unmount
    return () => {
      resetTheme();
    };
  }, [applyTheme, resetTheme]);

  // Handle high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    const handleContrastChange = () => {
      // Re-apply theme to account for high contrast preferences
      applyTheme();
    };

    mediaQuery.addEventListener('change', handleContrastChange);
    return () => mediaQuery.removeEventListener('change', handleContrastChange);
  }, [applyTheme]);

  // Handle reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionChange = () => {
      const container = document.getElementById(containerId);
      const targetElement = container || document.documentElement;

      if (mediaQuery.matches) {
        targetElement.classList.add('okami-widget-reduced-motion');
      } else {
        targetElement.classList.remove('okami-widget-reduced-motion');
      }
    };

    handleMotionChange(); // Apply initial state
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, [containerId]);

  return {
    themeVariables,
    applyTheme,
    resetTheme,
    isDarkMode,
    toggleDarkMode,
  };
};

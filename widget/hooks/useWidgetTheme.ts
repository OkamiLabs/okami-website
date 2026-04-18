/**
 * Widget Theme Hook
 *
 * Handles theme management with dark/light mode support and CSS custom properties
 */

import { useState, useEffect, useCallback } from 'react';
import { WidgetTheme, LIGHT_THEME, DARK_THEME } from '../types/widget';

interface UseWidgetThemeReturn {
  appliedTheme: WidgetTheme;
  updateTheme: (theme: Partial<WidgetTheme>) => void;
  toggleMode: () => void;
  resetTheme: () => void;
}

const applyThemeToDOM = (theme: WidgetTheme, containerSelector = '.okami-widget') => {
  const container = document.querySelector(containerSelector) as HTMLElement;
  if (container) {
    container.style.setProperty('--widget-primary-color', theme.primaryColor);
    container.style.setProperty('--widget-background-color', theme.backgroundColor);
    container.style.setProperty('--widget-text-color', theme.textColor);
    container.style.setProperty('--widget-border-radius', theme.borderRadius);
    container.style.setProperty('--widget-font-family', theme.fontFamily);
    container.setAttribute('data-theme', theme.mode);
  }
};

const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const resolveAutoTheme = (baseTheme: WidgetTheme): WidgetTheme => {
  if (baseTheme.mode !== 'auto') {
    return baseTheme;
  }

  const systemPreference = getSystemPreference();
  const themeBase = systemPreference === 'dark' ? DARK_THEME : LIGHT_THEME;

  return {
    ...themeBase,
    ...baseTheme,
    mode: systemPreference,
  };
};

export const useWidgetTheme = (initialTheme: WidgetTheme): UseWidgetThemeReturn => {
  const [currentTheme, setCurrentTheme] = useState<WidgetTheme>(() =>
    resolveAutoTheme(initialTheme)
  );

  // Update theme when system preference changes (for auto mode)
  useEffect(() => {
    if (initialTheme.mode === 'auto' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = () => {
        const newTheme = resolveAutoTheme(initialTheme);
        setCurrentTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined;
  }, [initialTheme]);

  // Apply theme to DOM when it changes
  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  // Update theme with partial values
  const updateTheme = useCallback((partialTheme: Partial<WidgetTheme>) => {
    setCurrentTheme(prev => {
      const newTheme = { ...prev, ...partialTheme };
      return resolveAutoTheme(newTheme);
    });
  }, []);

  // Toggle between light and dark mode
  const toggleMode = useCallback(() => {
    setCurrentTheme(prev => {
      const newMode = prev.mode === 'light' ? 'dark' : 'light';
      const baseTheme = newMode === 'dark' ? DARK_THEME : LIGHT_THEME;

      return {
        ...baseTheme,
        ...prev,
        mode: newMode,
      };
    });
  }, []);

  // Reset to initial theme
  const resetTheme = useCallback(() => {
    const resolved = resolveAutoTheme(initialTheme);
    setCurrentTheme(resolved);
  }, [initialTheme]);

  return {
    appliedTheme: currentTheme,
    updateTheme,
    toggleMode,
    resetTheme,
  };
};

export default useWidgetTheme;

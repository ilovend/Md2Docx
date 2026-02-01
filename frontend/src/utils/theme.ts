/**
 * Theme utility functions
 * Centralized theme management for the application
 */

export type ThemeType = 'dark' | 'light' | 'system';

/**
 * Apply theme to the document
 * @param theme - The theme to apply ('dark', 'light', or 'system')
 */
export const applyTheme = (theme: ThemeType): void => {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'system') {
    root.classList.toggle('dark', systemDark);
    root.classList.toggle('light', !systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }
};

/**
 * Get current theme from localStorage
 * @returns The saved theme or 'dark' as default
 */
export const getSavedTheme = (): ThemeType => {
  const saved = localStorage.getItem('md2docx_settings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      if (settings.theme) {
        return settings.theme as ThemeType;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return 'dark';
};

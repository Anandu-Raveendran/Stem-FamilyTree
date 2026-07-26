import { useThemeContext } from '../context/ThemeContext.jsx';

/**
 * @returns {{ theme: 'light'|'dark', isDark: boolean, toggleTheme: () => void }}
 */
export function useTheme() {
  return useThemeContext();
}

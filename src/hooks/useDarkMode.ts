import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kpi-theme';

/**
 * useDarkMode
 * Persists the user's theme preference to localStorage.
 * Applies / removes the `dark` class on <html> using the
 * Tailwind `darkMode: 'class'` strategy.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // 1. Respect explicit user preference saved in localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'dark';
    // 2. Fall back to OS-level preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync <html> class whenever state changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, 'light');
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);
  const setLight = useCallback(() => setIsDark(false), []);
  const setDark  = useCallback(() => setIsDark(true),  []);

  return { isDark, toggle, setLight, setDark };
}

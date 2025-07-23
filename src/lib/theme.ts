/**
 * Theme management utilities and configurations
 */

import type { ThemeConfig, ThemeMode } from './types';

/**
 * Dark theme configuration
 */
export const darkTheme: ThemeConfig = {
  mode: 'dark',
  colors: {
    background: '#111827', // gray-900
    text: '#f9fafb', // gray-50
    border: '#374151', // gray-700
    accent: '#3b82f6', // blue-500
    chartBackground: '#1f2937', // gray-800
  },
  chartTheme: {
    backgroundColor: '#1f2937',
    textStyle: {
      color: '#f9fafb',
    },
    series: {
      itemStyle: {
        color: '#3b82f6',
        borderColor: '#374151',
      },
      lineStyle: {
        color: '#6b7280',
      },
    },
  },
};

/**
 * Light theme configuration
 */
export const lightTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    background: '#ffffff', // white
    text: '#111827', // gray-900
    border: '#d1d5db', // gray-300
    accent: '#2563eb', // blue-600
    chartBackground: '#f9fafb', // gray-50
  },
  chartTheme: {
    backgroundColor: '#f9fafb',
    textStyle: {
      color: '#111827',
    },
    series: {
      itemStyle: {
        color: '#2563eb',
        borderColor: '#d1d5db',
      },
      lineStyle: {
        color: '#6b7280',
      },
    },
  },
};

/**
 * Get theme configuration by mode
 */
export function getThemeConfig(mode: ThemeMode): ThemeConfig {
  return mode === 'dark' ? darkTheme : lightTheme;
}

/**
 * Apply theme to document root
 */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;

  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Get theme preference from localStorage
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Default to dark theme as per requirements
  return 'dark';
}

/**
 * Store theme preference in localStorage
 */
export function storeTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('theme', mode);
}

/**
 * Initialize theme on app startup
 */
export function initializeTheme(): ThemeMode {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Initialize theme immediately for SSR compatibility
 */
export function initializeThemeSSR(): void {
  if (typeof window !== 'undefined') {
    const theme = getStoredTheme();
    applyTheme(theme);
  }
}

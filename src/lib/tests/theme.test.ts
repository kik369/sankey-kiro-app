/**
 * Tests for theme management system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getThemeConfig, applyTheme, getStoredTheme, storeTheme, initializeTheme } from '$lib/theme';
import type { ThemeMode } from '$lib/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock document
const documentMock = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
};

// Setup global mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(globalThis, 'document', {
  value: documentMock,
  writable: true,
});

describe('Theme Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getThemeConfig', () => {
    it('should return dark theme config for dark mode', () => {
      const config = getThemeConfig('dark');
      expect(config.mode).toBe('dark');
      expect(config.colors.background).toBe('#111827');
      expect(config.colors.text).toBe('#f9fafb');
    });

    it('should return light theme config for light mode', () => {
      const config = getThemeConfig('light');
      expect(config.mode).toBe('light');
      expect(config.colors.background).toBe('#ffffff');
      expect(config.colors.text).toBe('#111827');
    });
  });

  describe('applyTheme', () => {
    it('should add dark class for dark mode', () => {
      applyTheme('dark');
      expect(documentMock.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark class for light mode', () => {
      applyTheme('light');
      expect(documentMock.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('localStorage integration', () => {
    it('should store theme preference', () => {
      storeTheme('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should retrieve stored theme preference', () => {
      localStorageMock.getItem.mockReturnValue('light');
      const theme = getStoredTheme();
      expect(theme).toBe('light');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    });

    it('should default to dark theme when no preference stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const theme = getStoredTheme();
      expect(theme).toBe('dark');
    });

    it('should default to dark theme for invalid stored values', () => {
      localStorageMock.getItem.mockReturnValue('invalid');
      const theme = getStoredTheme();
      expect(theme).toBe('dark');
    });
  });

  describe('initializeTheme', () => {
    it('should initialize with stored theme and apply to DOM', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const theme = initializeTheme();

      expect(theme).toBe('light');
      expect(documentMock.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should initialize with default dark theme when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const theme = initializeTheme();

      expect(theme).toBe('dark');
      expect(documentMock.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });
  });
});

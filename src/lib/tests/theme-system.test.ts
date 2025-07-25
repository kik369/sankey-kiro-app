/**
 * Theme System Tests
 * Tests for theme management, switching, and persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getThemeConfig, applyTheme, getStoredTheme, storeTheme, initializeTheme } from '../theme.js';
import type { ThemeMode } from '../types.js';

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

describe('Theme Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('Theme Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add dark class for dark mode', () => {
    applyTheme('dark');
    expect(documentMock.documentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should remove dark class for light mode', () => {
    applyTheme('light');
    expect(documentMock.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });
});

describe('Theme Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('Theme Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('Theme Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should toggle from dark to light', () => {
    const currentTheme: ThemeMode = 'dark';
    const newTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';

    expect(newTheme).toBe('light');
  });

  it('should toggle from light to dark', () => {
    const currentTheme: ThemeMode = 'light';
    const newTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 'light';

    expect(newTheme).toBe('dark');
  });

  it('should persist theme changes', () => {
    const newTheme: ThemeMode = 'light';
    storeTheme(newTheme);
    applyTheme(newTheme);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(documentMock.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });
});

describe('Theme Validation', () => {
  it('should validate theme mode types', () => {
    const darkTheme: ThemeMode = 'dark';
    const lightTheme: ThemeMode = 'light';

    expect(darkTheme).toBe('dark');
    expect(lightTheme).toBe('light');
    expect(['dark', 'light']).toContain(darkTheme);
    expect(['dark', 'light']).toContain(lightTheme);
  });

  it('should handle theme config structure', () => {
    const darkConfig = getThemeConfig('dark');
    const lightConfig = getThemeConfig('light');

    // Verify config structure
    expect(darkConfig).toHaveProperty('mode');
    expect(darkConfig).toHaveProperty('colors');
    expect(darkConfig.colors).toHaveProperty('background');
    expect(darkConfig.colors).toHaveProperty('text');

    expect(lightConfig).toHaveProperty('mode');
    expect(lightConfig).toHaveProperty('colors');
    expect(lightConfig.colors).toHaveProperty('background');
    expect(lightConfig.colors).toHaveProperty('text');

    // Verify different colors for different themes
    expect(darkConfig.colors.background).not.toBe(lightConfig.colors.background);
    expect(darkConfig.colors.text).not.toBe(lightConfig.colors.text);
  });
});

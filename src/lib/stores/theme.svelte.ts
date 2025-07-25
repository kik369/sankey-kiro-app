/**
 * Theme state management using Svelte 5 runes
 */

import type { ThemeMode, ThemeConfig } from '$lib/types';
import { getThemeConfig, initializeTheme, applyTheme, storeTheme } from '../theme';

/**
 * Theme state management class using Svelte 5 runes
 */
class ThemeStore {
  private _mode = $state('dark' as ThemeMode);
  private _config = $state(getThemeConfig('dark'));
  private _initialized = $state(false);

  constructor() {
    // Don't initialize automatically in constructor
    // Let the component handle initialization
  }

  /**
   * Initialize theme from localStorage and apply to DOM
   */
  initialize() {
    if (this._initialized || typeof window === 'undefined') return;

    const storedTheme = initializeTheme();
    this._mode = storedTheme;
    this._config = getThemeConfig(storedTheme);
    this._initialized = true;
  }

  /**
   * Get current theme mode
   */
  get mode(): ThemeMode {
    return this._mode;
  }

  /**
   * Get current theme configuration
   */
  get config(): ThemeConfig {
    return this._config;
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Set theme mode and persist to localStorage
   */
  setMode(newMode: ThemeMode) {
    if (this._mode === newMode) return;

    this._mode = newMode;
    this._config = getThemeConfig(newMode);

    // Apply theme to DOM and persist
    applyTheme(newMode);
    storeTheme(newMode);
  }

  /**
   * Toggle between dark and light themes
   */
  toggle() {
    const newMode = this._mode === 'dark' ? 'light' : 'dark';
    this.setMode(newMode);
  }

  /**
   * Check if current theme is dark
   */
  get isDark(): boolean {
    return this._mode === 'dark';
  }

  /**
   * Check if current theme is light
   */
  get isLight(): boolean {
    return this._mode === 'light';
  }
}

/**
 * Global theme store instance
 */
export const themeStore = new ThemeStore();

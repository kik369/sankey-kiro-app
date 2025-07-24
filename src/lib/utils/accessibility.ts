/**
 * Accessibility utilities for the Sankey diagram app
 * Implements WCAG 2.1 AA compliance features
 */

export interface AccessibilityOptions {
  enableKeyboardNavigation: boolean;
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
}

/**
 * Keyboard navigation handler for interactive elements
 */
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = 0;
  private container: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
    this.setupEventListeners();
  }

  private updateFocusableElements() {
    if (!this.container) return;

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'a[href]'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];
  }

  private setupEventListeners() {
    if (!this.container) return;

    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusNext();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPrevious();
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.focusLast();
        break;
      case 'Enter':
      case ' ':
        this.handleActivation(event);
        break;
      case 'Escape':
        this.handleEscape(event);
        break;
    }
  }

  private handleTabNavigation(event: KeyboardEvent) {
    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(activeElement);

    if (event.shiftKey) {
      // Shift+Tab - go to previous element
      if (currentIndex <= 0) {
        event.preventDefault();
        this.focusLast();
      }
    } else {
      // Tab - go to next element
      if (currentIndex >= this.focusableElements.length - 1) {
        event.preventDefault();
        this.focusFirst();
      }
    }
  }

  private focusNext() {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private focusPrevious() {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = this.currentFocusIndex <= 0
      ? this.focusableElements.length - 1
      : this.currentFocusIndex - 1;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private focusFirst() {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = 0;
    this.focusableElements[0]?.focus();
  }

  private focusLast() {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = this.focusableElements.length - 1;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private handleActivation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      target.click();
    }
  }

  private handleEscape(event: KeyboardEvent) {
    // Close any open modals or return focus to main content
    const target = event.target as HTMLElement;
    target.blur();

    // Focus the main content area
    const mainContent = this.container?.querySelector('[role="main"]') as HTMLElement;
    mainContent?.focus();
  }

  public destroy() {
    if (this.container) {
      this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }
}

/**
 * Screen reader utilities for chart accessibility
 */
export class ScreenReaderManager {
  private announcements: HTMLElement | null = null;

  constructor() {
    this.createAnnouncementRegion();
  }

  private createAnnouncementRegion() {
    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.className = 'sr-only';
    this.announcements.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.announcements);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcements) return;

    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = '';
      }
    }, 1000);
  }

  public announceChartUpdate(nodeCount: number, connectionCount: number) {
    const message = `Chart updated. ${nodeCount} nodes and ${connectionCount} connections displayed.`;
    this.announce(message);
  }

  public announceError(errorMessage: string) {
    this.announce(`Error: ${errorMessage}`, 'assertive');
  }

  public announceSuccess(successMessage: string) {
    this.announce(successMessage);
  }

  public destroy() {
    if (this.announcements && this.announcements.parentNode) {
      this.announcements.parentNode.removeChild(this.announcements);
    }
  }
}

/**
 * High contrast mode utilities
 */
export class HighContrastManager {
  private isHighContrast = false;

  constructor() {
    this.detectSystemPreference();
    this.setupMediaQueryListener();
  }

  private detectSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      this.isHighContrast = mediaQuery.matches;
      this.applyHighContrast(this.isHighContrast);
    }
  }

  private setupMediaQueryListener() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      mediaQuery.addEventListener('change', (e) => {
        this.isHighContrast = e.matches;
        this.applyHighContrast(this.isHighContrast);
      });
    }
  }

  private applyHighContrast(enabled: boolean) {
    document.documentElement.classList.toggle('high-contrast', enabled);
  }

  public toggle() {
    this.isHighContrast = !this.isHighContrast;
    this.applyHighContrast(this.isHighContrast);
    return this.isHighContrast;
  }

  public getState() {
    return this.isHighContrast;
  }
}

/**
 * Reduced motion utilities
 */
export class ReducedMotionManager {
  private prefersReducedMotion = false;

  constructor() {
    this.detectSystemPreference();
    this.setupMediaQueryListener();
  }

  private detectSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
      this.applyReducedMotion(this.prefersReducedMotion);
    }
  }

  private setupMediaQueryListener() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        this.applyReducedMotion(this.prefersReducedMotion);
      });
    }
  }

  private applyReducedMotion(enabled: boolean) {
    document.documentElement.classList.toggle('reduce-motion', enabled);
  }

  public getState() {
    return this.prefersReducedMotion;
  }
}

/**
 * Main accessibility manager
 */
export class AccessibilityManager {
  private keyboardManager: KeyboardNavigationManager | null = null;
  private screenReaderManager: ScreenReaderManager;
  private highContrastManager: HighContrastManager;
  private reducedMotionManager: ReducedMotionManager;

  constructor(container: HTMLElement, options: Partial<AccessibilityOptions> = {}) {
    const defaultOptions: AccessibilityOptions = {
      enableKeyboardNavigation: true,
      enableScreenReader: true,
      enableHighContrast: true,
      enableReducedMotion: true,
    };

    const config = { ...defaultOptions, ...options };

    if (config.enableKeyboardNavigation) {
      this.keyboardManager = new KeyboardNavigationManager(container);
    }

    this.screenReaderManager = new ScreenReaderManager();
    this.highContrastManager = new HighContrastManager();
    this.reducedMotionManager = new ReducedMotionManager();
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.screenReaderManager.announce(message, priority);
  }

  public announceChartUpdate(nodeCount: number, connectionCount: number) {
    this.screenReaderManager.announceChartUpdate(nodeCount, connectionCount);
  }

  public announceError(errorMessage: string) {
    this.screenReaderManager.announceError(errorMessage);
  }

  public announceSuccess(successMessage: string) {
    this.screenReaderManager.announceSuccess(successMessage);
  }

  public toggleHighContrast() {
    return this.highContrastManager.toggle();
  }

  public getHighContrastState() {
    return this.highContrastManager.getState();
  }

  public getReducedMotionState() {
    return this.reducedMotionManager.getState();
  }

  public destroy() {
    this.keyboardManager?.destroy();
    this.screenReaderManager.destroy();
  }
}

/**
 * Utility function to create accessible chart descriptions
 */
export function generateChartDescription(nodeCount: number, connectionCount: number, flows: any[]): string {
  if (flows.length === 0) {
    return "Empty Sankey diagram. No data flows to display.";
  }

  const totalValue = flows.reduce((sum, flow) => sum + flow.value, 0);
  const avgValue = totalValue / flows.length;

  let description = `Sankey diagram with ${nodeCount} nodes and ${connectionCount} connections. `;
  description += `Total flow value: ${totalValue.toFixed(2)}. Average flow value: ${avgValue.toFixed(2)}. `;

  // Add information about largest flows
  const sortedFlows = [...flows].sort((a, b) => b.value - a.value);
  const topFlows = sortedFlows.slice(0, 3);

  if (topFlows.length > 0) {
    description += "Largest flows: ";
    description += topFlows.map(flow =>
      `${flow.source} to ${flow.target} with value ${flow.value}`
    ).join(", ");
  }

  return description;
}

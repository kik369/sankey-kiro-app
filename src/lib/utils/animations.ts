/**
 * Animation utilities for smooth UI interactions
 * Respects user preferences for reduced motion
 */

import { browser } from '$app/environment';

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  respectReducedMotion: boolean;
}

export interface TransitionConfig extends AnimationConfig {
  property: string;
}

/**
 * Animation manager that respects accessibility preferences
 */
export class AnimationManager {
  private prefersReducedMotion = false;
  private activeAnimations = new Set<Animation>();

  constructor() {
    if (browser) {
      this.detectMotionPreference();
      this.setupMediaQueryListener();
    }
  }

  private detectMotionPreference(): void {
    if (browser && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  private setupMediaQueryListener(): void {
    if (browser && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;

        // Cancel all animations if reduced motion is preferred
        if (this.prefersReducedMotion) {
          this.cancelAllAnimations();
        }
      });
    }
  }

  /**
   * Creates a fade in animation
   */
  public fadeIn(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.opacity = '1';
      return Promise.resolve();
    }

    return this.animate(element, [
      { opacity: 0 },
      { opacity: 1 }
    ], finalConfig);
  }

  /**
   * Creates a fade out animation
   */
  public fadeOut(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.opacity = '0';
      return Promise.resolve();
    }

    return this.animate(element, [
      { opacity: 1 },
      { opacity: 0 }
    ], finalConfig);
  }

  /**
   * Creates a slide in from top animation
   */
  public slideInFromTop(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      return Promise.resolve();
    }

    return this.animate(element, [
      { transform: 'translateY(-20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], finalConfig);
  }

  /**
   * Creates a slide in from bottom animation
   */
  public slideInFromBottom(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      return Promise.resolve();
    }

    return this.animate(element, [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], finalConfig);
  }

  /**
   * Creates a scale in animation
   */
  public scaleIn(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
      return Promise.resolve();
    }

    return this.animate(element, [
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], finalConfig);
  }

  /**
   * Creates a bounce animation
   */
  public bounce(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig({ ...config, duration: 600 });

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      return Promise.resolve();
    }

    return this.animate(element, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1)' }
    ], finalConfig);
  }

  /**
   * Creates a shake animation for error states
   */
  public shake(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig({ ...config, duration: 500 });

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      // Just add a subtle border color change for reduced motion
      element.style.borderColor = '#ef4444';
      setTimeout(() => {
        element.style.borderColor = '';
      }, 200);
      return Promise.resolve();
    }

    return this.animate(element, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ], finalConfig);
  }

  /**
   * Creates a pulse animation
   */
  public pulse(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig({ ...config, duration: 1000 });

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      return Promise.resolve();
    }

    return this.animate(element, [
      { opacity: 1 },
      { opacity: 0.7 },
      { opacity: 1 }
    ], finalConfig);
  }

  /**
   * Creates a smooth height transition
   */
  public expandHeight(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.height = 'auto';
      return Promise.resolve();
    }

    const startHeight = element.offsetHeight;
    element.style.height = 'auto';
    const endHeight = element.offsetHeight;
    element.style.height = `${startHeight}px`;

    return this.animate(element, [
      { height: `${startHeight}px` },
      { height: `${endHeight}px` }
    ], finalConfig).then(() => {
      element.style.height = 'auto';
    });
  }

  /**
   * Creates a smooth height collapse
   */
  public collapseHeight(element: HTMLElement, config: Partial<AnimationConfig> = {}): Promise<void> {
    const finalConfig = this.getAnimationConfig(config);

    if (this.prefersReducedMotion && finalConfig.respectReducedMotion) {
      element.style.height = '0';
      return Promise.resolve();
    }

    const startHeight = element.offsetHeight;

    return this.animate(element, [
      { height: `${startHeight}px` },
      { height: '0px' }
    ], finalConfig);
  }

  /**
   * Creates a staggered animation for multiple elements
   */
  public staggerIn(elements: HTMLElement[], config: Partial<AnimationConfig> = {}): Promise<void[]> {
    const finalConfig = this.getAnimationConfig(config);
    const staggerDelay = 100; // 100ms between each element

    const animations = elements.map((element, index) => {
      const elementConfig = {
        ...finalConfig,
        delay: (finalConfig.delay || 0) + (index * staggerDelay)
      };

      return this.slideInFromBottom(element, elementConfig);
    });

    return Promise.all(animations);
  }

  /**
   * Generic animation method
   */
  private animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    config: AnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.prefersReducedMotion && config.respectReducedMotion) {
        resolve();
        return;
      }

      const animation = element.animate(keyframes, {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay || 0,
        fill: 'forwards'
      });

      this.activeAnimations.add(animation);

      animation.addEventListener('finish', () => {
        this.activeAnimations.delete(animation);
        resolve();
      });

      animation.addEventListener('cancel', () => {
        this.activeAnimations.delete(animation);
        resolve();
      });
    });
  }

  /**
   * Gets animation config with defaults
   */
  private getAnimationConfig(config: Partial<AnimationConfig>): AnimationConfig {
    return {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      respectReducedMotion: true,
      ...config
    };
  }

  /**
   * Cancels all active animations
   */
  public cancelAllAnimations(): void {
    this.activeAnimations.forEach(animation => {
      animation.cancel();
    });
    this.activeAnimations.clear();
  }

  /**
   * Gets the current reduced motion preference
   */
  public getPrefersReducedMotion(): boolean {
    return this.prefersReducedMotion;
  }
}

/**
 * CSS transition utilities
 */
export class TransitionManager {
  /**
   * Applies a smooth transition to an element
   */
  public static applyTransition(element: HTMLElement, config: TransitionConfig): void {
    const { property, duration, easing, delay, respectReducedMotion } = config;

    // Check for reduced motion preference
    const prefersReducedMotion = browser && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion && respectReducedMotion) {
      element.style.transition = 'none';
      return;
    }

    const transitionValue = `${property} ${duration}ms ${easing}${delay ? ` ${delay}ms` : ''}`;
    element.style.transition = transitionValue;
  }

  /**
   * Removes all transitions from an element
   */
  public static removeTransition(element: HTMLElement): void {
    element.style.transition = 'none';
  }

  /**
   * Creates a smooth color transition
   */
  public static colorTransition(element: HTMLElement, duration = 200): void {
    this.applyTransition(element, {
      property: 'color, background-color, border-color',
      duration,
      easing: 'ease-in-out',
      respectReducedMotion: true
    });
  }

  /**
   * Creates a smooth transform transition
   */
  public static transformTransition(element: HTMLElement, duration = 300): void {
    this.applyTransition(element, {
      property: 'transform',
      duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      respectReducedMotion: true
    });
  }

  /**
   * Creates a smooth opacity transition
   */
  public static opacityTransition(element: HTMLElement, duration = 200): void {
    this.applyTransition(element, {
      property: 'opacity',
      duration,
      easing: 'ease-in-out',
      respectReducedMotion: true
    });
  }
}

/**
 * Global animation manager instance
 */
export const animationManager = browser ? new AnimationManager() : null;

/**
 * Utility functions for common animations
 */
export const animations = {
  fadeIn: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.fadeIn(element, config) || Promise.resolve(),

  fadeOut: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.fadeOut(element, config) || Promise.resolve(),

  slideInFromTop: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.slideInFromTop(element, config) || Promise.resolve(),

  slideInFromBottom: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.slideInFromBottom(element, config) || Promise.resolve(),

  scaleIn: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.scaleIn(element, config) || Promise.resolve(),

  bounce: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.bounce(element, config) || Promise.resolve(),

  shake: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.shake(element, config) || Promise.resolve(),

  pulse: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.pulse(element, config) || Promise.resolve(),

  expandHeight: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.expandHeight(element, config) || Promise.resolve(),

  collapseHeight: (element: HTMLElement, config?: Partial<AnimationConfig>) =>
    animationManager?.collapseHeight(element, config) || Promise.resolve(),

  staggerIn: (elements: HTMLElement[], config?: Partial<AnimationConfig>) =>
    animationManager?.staggerIn(elements, config) || Promise.resolve([])
};

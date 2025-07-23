/**
 * Debouncing utilities for performance optimization
 */

/**
 * Creates a debounced version of a function
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a throttled version of a function
 * @param func - The function to throttle
 * @param delay - The delay in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      // Execute immediately if enough time has passed
      lastCall = now;
      func(...args);
    } else {
      // Schedule execution for later
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };
}

/**
 * Creates a debounced state updater for Svelte runes
 * @param initialValue - Initial state value
 * @param delay - Debounce delay in milliseconds
 * @returns Object with current value, immediate setter, and debounced setter
 */
export function createDebouncedState<T>(initialValue: T, delay: number) {
  let currentValue = $state(initialValue);
  let debouncedValue = $state(initialValue);
  let timeoutId: number | null = null;

  const updateDebounced = (newValue: T) => {
    currentValue = newValue;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      debouncedValue = newValue;
      timeoutId = null;
    }, delay);
  };

  const updateImmediate = (newValue: T) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    currentValue = newValue;
    debouncedValue = newValue;
  };

  return {
    get current() { return currentValue; },
    get debounced() { return debouncedValue; },
    updateDebounced,
    updateImmediate,
    cleanup: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}

/**
 * Styling diagnostics utility to help identify CSS/styling issues
 */

export interface StylingDiagnostics {
  tailwindLoaded: boolean;
  darkModeActive: boolean;
  themeClassPresent: boolean;
  cssVariablesPresent: boolean;
  computedStyles: Record<string, string>;
  recommendations: string[];
}

/**
 * Diagnose styling issues in the application
 */
export function diagnoseStyling(): StylingDiagnostics {
  if (typeof window === 'undefined') {
    return {
      tailwindLoaded: false,
      darkModeActive: false,
      themeClassPresent: false,
      cssVariablesPresent: false,
      computedStyles: {},
      recommendations: ['Diagnostics only available in browser environment']
    };
  }

  const diagnostics: StylingDiagnostics = {
    tailwindLoaded: false,
    darkModeActive: false,
    themeClassPresent: false,
    cssVariablesPresent: false,
    computedStyles: {},
    recommendations: []
  };

  // Check if Tailwind CSS is loaded
  const testElement = document.createElement('div');
  testElement.className = 'bg-blue-500 text-white p-4 hidden';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  diagnostics.tailwindLoaded = computedStyle.backgroundColor === 'rgb(59, 130, 246)'; // blue-500

  document.body.removeChild(testElement);

  // Check dark mode
  diagnostics.darkModeActive = document.documentElement.classList.contains('dark');
  diagnostics.themeClassPresent = document.documentElement.classList.length > 0;

  // Check CSS variables
  const rootStyle = window.getComputedStyle(document.documentElement);
  diagnostics.cssVariablesPresent = rootStyle.getPropertyValue('--tw-bg-opacity') !== '';

  // Get computed styles for key elements
  const bodyStyle = window.getComputedStyle(document.body);
  diagnostics.computedStyles = {
    bodyBackground: bodyStyle.backgroundColor,
    bodyColor: bodyStyle.color,
    bodyFontFamily: bodyStyle.fontFamily,
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className
  };

  // Generate recommendations
  if (!diagnostics.tailwindLoaded) {
    diagnostics.recommendations.push('Tailwind CSS may not be loaded properly. Check build configuration.');
  }

  if (!diagnostics.themeClassPresent) {
    diagnostics.recommendations.push('No theme classes found on html element. Theme system may not be working.');
  }

  if (diagnostics.darkModeActive && diagnostics.computedStyles.bodyBackground === 'rgb(255, 255, 255)') {
    diagnostics.recommendations.push('Dark mode is active but background is still white. Check CSS specificity.');
  }

  if (!diagnostics.darkModeActive && diagnostics.computedStyles.bodyBackground === 'rgb(17, 24, 39)') {
    diagnostics.recommendations.push('Light mode is active but background is still dark. Check CSS specificity.');
  }

  return diagnostics;
}

/**
 * Print styling diagnostics to console
 */
export function printStylingDiagnostics(): void {
  const diagnostics = diagnoseStyling();

  console.group('🎨 Styling Diagnostics');
  console.log('Tailwind Loaded:', diagnostics.tailwindLoaded ? '✅' : '❌');
  console.log('Dark Mode Active:', diagnostics.darkModeActive ? '🌙' : '☀️');
  console.log('Theme Class Present:', diagnostics.themeClassPresent ? '✅' : '❌');
  console.log('CSS Variables Present:', diagnostics.cssVariablesPresent ? '✅' : '❌');

  console.group('Computed Styles');
  Object.entries(diagnostics.computedStyles).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();

  if (diagnostics.recommendations.length > 0) {
    console.group('🔧 Recommendations');
    diagnostics.recommendations.forEach(rec => console.log('•', rec));
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Create a visual styling test component
 */
export function createStylingTest(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50 max-w-sm';

  const diagnostics = diagnoseStyling();

  container.innerHTML = `
    <div class="text-sm">
      <h3 class="font-bold text-gray-900 dark:text-white mb-2">Styling Test</h3>
      <div class="space-y-1 text-gray-600 dark:text-gray-400">
        <div>Tailwind: ${diagnostics.tailwindLoaded ? '✅' : '❌'}</div>
        <div>Dark Mode: ${diagnostics.darkModeActive ? '🌙' : '☀️'}</div>
        <div>Theme Class: ${diagnostics.themeClassPresent ? '✅' : '❌'}</div>
        <div class="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200">
          This should be blue background
        </div>
        <div class="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-red-800 dark:text-red-200">
          This should be red background
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()"
                class="mt-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500">
          Close
        </button>
      </div>
    </div>
  `;

  return container;
}

/**
 * Add styling test to page
 */
export function addStylingTest(): void {
  if (typeof window === 'undefined') return;

  const existingTest = document.querySelector('[data-styling-test]');
  if (existingTest) {
    existingTest.remove();
  }

  const test = createStylingTest();
  test.setAttribute('data-styling-test', 'true');
  document.body.appendChild(test);

  // Also print to console
  printStylingDiagnostics();
}

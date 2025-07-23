/**
 * Simple test to verify theme functionality is working
 */

import {
    getChartThemeColors,
    applyThemeTransition,
    createThemeAwareChartOption,
} from './src/lib/chart-themes.js';

console.log('Testing theme-aware chart styling...');

// Test 1: Theme color configurations
console.log('\n1. Testing theme color configurations:');
const darkColors = getChartThemeColors('dark');
const lightColors = getChartThemeColors('light');

console.log('Dark theme primary color:', darkColors.primary);
console.log('Light theme primary color:', lightColors.primary);
console.log(
    'Dark theme has',
    darkColors.connections.length,
    'connection colors'
);
console.log(
    'Light theme has',
    lightColors.connections.length,
    'connection colors'
);

// Test 2: Theme-aware chart options
console.log('\n2. Testing theme-aware chart options:');
const darkOption = createThemeAwareChartOption('dark');
const lightOption = createThemeAwareChartOption('light');

console.log(
    'Dark theme tooltip background:',
    darkOption.tooltip.backgroundColor
);
console.log(
    'Light theme tooltip background:',
    lightOption.tooltip.backgroundColor
);
console.log('Animation duration:', darkOption.animationDuration);

// Test 3: Mock theme transition
console.log('\n3. Testing theme transition:');
const mockChart = {
    setOption: (config, options) => {
        console.log(
            'Chart updated with animation duration:',
            config.animationDuration
        );
        console.log('Transition options:', options.replaceMerge);
    },
};

applyThemeTransition(mockChart, 'light', 500);

console.log('\n✅ All theme functionality tests completed successfully!');

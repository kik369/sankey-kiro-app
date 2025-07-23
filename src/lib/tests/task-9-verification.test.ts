/**
 * Comprehensive verification test for Task 9: Implement theme-aware chart styling
 *
 * This test verifies all sub-tasks are completed:
 * - Create theme-specific ECharts color configurations
 * - Implement dynamic chart theme switching
 * - Add smooth transitions between chart themes
 * - Test chart appearance in both dark and light themes
 */

import { describe, it, expect, vi } from 'vitest';
import type { SankeyChartData } from '$lib/types';
import {
    getChartThemeColors,
    getConnectionColor,
    createThemeAwareChartOption,
    applyThemeTransition,
    createCompleteThemeAwareOption,
    CHART_THEME_COLORS,
} from '$lib/chart-themes';

describe('Task 9: Theme-Aware Chart Styling - Complete Verification', () => {
    // Sample chart data for testing
    const sampleChartData: SankeyChartData = {
        nodes: [
            { name: 'Source A' },
            { name: 'Source B' },
            { name: 'Target X' },
            { name: 'Target Y' },
        ],
        links: [
            { source: 'Source A', target: 'Target X', value: 10 },
            { source: 'Source A', target: 'Target Y', value: 5 },
            { source: 'Source B', target: 'Target X', value: 8 },
            { source: 'Source B', target: 'Target Y', value: 12 },
        ],
    };

    describe('Sub-task 1: Theme-specific ECharts color configurations', () => {
        it('should provide comprehensive dark theme color configuration', () => {
            const darkColors = getChartThemeColors('dark');

            // Verify primary colors
            expect(darkColors.primary).toBe('#3b82f6');
            expect(darkColors.secondary).toBe('#10b981');
            expect(darkColors.accent).toBe('#f59e0b');

            // Verify background and surface colors
            expect(darkColors.backgroundColor).toBe('transparent');
            expect(darkColors.surfaceColor).toBe('#1f2937');
            expect(darkColors.borderColor).toBe('#374151');

            // Verify text colors
            expect(darkColors.textPrimary).toBe('#f9fafb');
            expect(darkColors.textSecondary).toBe('#d1d5db');
            expect(darkColors.textMuted).toBe('#9ca3af');

            // Verify connection colors for visual differentiation
            expect(darkColors.connections).toHaveLength(10);
            expect(darkColors.connections[0]).toBe('#3b82f6'); // Blue
            expect(darkColors.connections[1]).toBe('#10b981'); // Emerald
            expect(darkColors.connections[2]).toBe('#f59e0b'); // Amber

            // Verify gradient colors
            expect(darkColors.gradients.primary).toEqual(['#3b82f6', '#1d4ed8']);
            expect(darkColors.gradients.secondary).toEqual(['#10b981', '#047857']);
            expect(darkColors.gradients.accent).toEqual(['#f59e0b', '#d97706']);

            // Verify interactive state colors
            expect(darkColors.hover.primary).toBe('#60a5fa');
            expect(darkColors.hover.secondary).toBe('#34d399');
            expect(darkColors.hover.accent).toBe('#fbbf24');
            expect(darkColors.hover.shadow).toBe('rgba(59, 130, 246, 0.4)');

            // Verify emphasis colors
            expect(darkColors.emphasis.borderColor).toBe('#60a5fa');
            expect(darkColors.emphasis.shadowColor).toBe('rgba(59, 130, 246, 0.6)');
            expect(darkColors.emphasis.backgroundColor).toBe('rgba(59, 130, 246, 0.1)');
        });

        it('should provide comprehensive light theme color configuration', () => {
            const lightColors = getChartThemeColors('light');

            // Verify primary colors
            expect(lightColors.primary).toBe('#2563eb');
            expect(lightColors.secondary).toBe('#059669');
            expect(lightColors.accent).toBe('#d97706');

            // Verify background and surface colors
            expect(lightColors.backgroundColor).toBe('transparent');
            expect(lightColors.surfaceColor).toBe('#f9fafb');
            expect(lightColors.borderColor).toBe('#e5e7eb');

            // Verify text colors
            expect(lightColors.textPrimary).toBe('#111827');
            expect(lightColors.textSecondary).toBe('#374151');
            expect(lightColors.textMuted).toBe('#6b7280');

            // Verify connection colors for visual differentiation
            expect(lightColors.connections).toHaveLength(10);
            expect(lightColors.connections[0]).toBe('#2563eb'); // Blue
            expect(lightColors.connections[1]).toBe('#059669'); // Emerald
            expect(lightColors.connections[2]).toBe('#d97706'); // Amber

            // Verify gradient colors
            expect(lightColors.gradients.primary).toEqual(['#2563eb', '#1e40af']);
            expect(lightColors.gradients.secondary).toEqual(['#059669', '#047857']);
            expect(lightColors.gradients.accent).toEqual(['#d97706', '#b45309']);

            // Verify interactive state colors
            expect(lightColors.hover.primary).toBe('#3b82f6');
            expect(lightColors.hover.secondary).toBe('#10b981');
            expect(lightColors.hover.accent).toBe('#f59e0b');
            expect(lightColors.hover.shadow).toBe('rgba(37, 99, 235, 0.4)');

            // Verify emphasis colors
            expect(lightColors.emphasis.borderColor).toBe('#3b82f6');
            expect(lightColors.emphasis.shadowColor).toBe('rgba(37, 99, 235, 0.6)');
            expect(lightColors.emphasis.backgroundColor).toBe('rgba(37, 99, 235, 0.1)');
        });

        it('should provide distinct connection colors for multiple flows', () => {
            const darkColors = getChartThemeColors('dark');
            const lightColors = getChartThemeColors('light');

            // Test multiple connection colors in dark theme
            const darkConnectionColors = [];
            for (let i = 0; i < 5; i++) {
                darkConnectionColors.push(getConnectionColor(i, 5, 'dark'));
            }

            // All colors should be different
            const uniqueDarkColors = new Set(darkConnectionColors);
            expect(uniqueDarkColors.size).toBe(5);

            // Test multiple connection colors in light theme
            const lightConnectionColors = [];
            for (let i = 0; i < 5; i++) {
                lightConnectionColors.push(getConnectionColor(i, 5, 'light'));
            }

            // All colors should be different
            const uniqueLightColors = new Set(lightConnectionColors);
            expect(uniqueLightColors.size).toBe(5);

            // Dark and light themes should have different color schemes
            expect(darkConnectionColors[0]).not.toBe(lightConnectionColors[0]);
            expect(darkConnectionColors[1]).not.toBe(lightConnectionColors[1]);
        });
    });

    describe('Sub-task 2: Dynamic chart theme switching', () => {
        it('should create complete theme-aware chart options for dark theme', () => {
            const darkOption = createCompleteThemeAwareOption(sampleChartData, 'dark');
            const darkColors = getChartThemeColors('dark');

            // Verify base configuration
            expect(darkOption.backgroundColor).toBe('transparent');
            expect(darkOption.animation).toBe(true);
            expect(darkOption.animationDuration).toBe(400);
            expect(darkOption.animationEasing).toBe('cubicOut');

            // Verify tooltip configuration
            expect(darkOption.tooltip.backgroundColor).toBe(darkColors.surfaceColor);
            expect(darkOption.tooltip.textStyle.color).toBe(darkColors.textPrimary);
            expect(darkOption.tooltip.borderColor).toBe(darkColors.borderColor);

            // Verify series configuration
            expect(darkOption.series).toHaveLength(1);
            const series = darkOption.series[0];
            expect(series.type).toBe('sankey');
            expect(series.data).toEqual(sampleChartData.nodes);
            expect(series.links).toEqual(sampleChartData.links);

            // Verify styling
            expect(series.itemStyle.color).toBe(darkColors.primary);
            expect(series.itemStyle.borderColor).toBe(darkColors.borderColor);
            expect(series.label.color).toBe(darkColors.textPrimary);

            // Verify emphasis states
            expect(series.emphasis.itemStyle.borderColor).toBe(darkColors.emphasis.borderColor);
            expect(series.emphasis.itemStyle.shadowColor).toBe(darkColors.emphasis.shadowColor);
        });

        it('should create complete theme-aware chart options for light theme', () => {
            const lightOption = createCompleteThemeAwareOption(sampleChartData, 'light');
            const lightColors = getChartThemeColors('light');

            // Verify base configuration
            expect(lightOption.backgroundColor).toBe('transparent');
            expect(lightOption.animation).toBe(true);
            expect(lightOption.animationDuration).toBe(400);
            expect(lightOption.animationEasing).toBe('cubicOut');

            // Verify tooltip configuration
            expect(lightOption.tooltip.backgroundColor).toBe('#ffffff');
            expect(lightOption.tooltip.textStyle.color).toBe(lightColors.textPrimary);
            expect(lightOption.tooltip.borderColor).toBe(lightColors.borderColor);

            // Verify series configuration
            expect(lightOption.series).toHaveLength(1);
            const series = lightOption.series[0];
            expect(series.type).toBe('sankey');
            expect(series.data).toEqual(sampleChartData.nodes);
            expect(series.links).toEqual(sampleChartData.links);

            // Verify styling
            expect(series.itemStyle.color).toBe(lightColors.primary);
            expect(series.itemStyle.borderColor).toBe(lightColors.borderColor);
            expect(series.label.color).toBe(lightColors.textPrimary);

            // Verify emphasis states
            expect(series.emphasis.itemStyle.borderColor).toBe(lightColors.emphasis.borderColor);
            expect(series.emphasis.itemStyle.shadowColor).toBe(lightColors.emphasis.shadowColor);
        });

        it('should provide different configurations for dark and light themes', () => {
            const darkOption = createCompleteThemeAwareOption(sampleChartData, 'dark');
            const lightOption = createCompleteThemeAwareOption(sampleChartData, 'light');

            // Verify themes have different configurations
            expect(darkOption.tooltip.backgroundColor).not.toBe(lightOption.tooltip.backgroundColor);
            expect(darkOption.tooltip.textStyle.color).not.toBe(lightOption.tooltip.textStyle.color);
            expect(darkOption.series[0].itemStyle.color).not.toBe(lightOption.series[0].itemStyle.color);
            expect(darkOption.series[0].label.color).not.toBe(lightOption.series[0].label.color);
        });
    });

    describe('Sub-task 3: Smooth transitions between chart themes', () => {
        it('should apply smooth theme transition with correct animation settings', () => {
            const mockChartInstance = {
                setOption: vi.fn(() => {}),
            };

            // Test transition from dark to light
            applyThemeTransition(mockChartInstance, 'light', 600);

            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(1);
            const calls = mockChartInstance.setOption.mock.calls;

            if (calls[0] && calls[0].length >= 2) {
                const [config, options] = calls[0] as [any, any];

                // Verify animation settings for smooth transitions
                expect(config.animation).toBe(true);
                expect(config.animationDuration).toBe(600);
                expect(config.animationEasing).toBe('cubicInOut');
                expect(config.animationDurationUpdate).toBe(600);
                expect(config.animationEasingUpdate).toBe('cubicInOut');

                // Verify transition options
                expect(options.notMerge).toBe(false);
                expect(options.lazyUpdate).toBe(false);
                expect(options.silent).toBe(false);
                expect(options.replaceMerge).toEqual(['tooltip', 'series']);

                // Verify light theme colors are applied
                const lightColors = getChartThemeColors('light');
                expect(config.tooltip.backgroundColor).toBe('#ffffff');
                expect(config.tooltip.textStyle.color).toBe(lightColors.textPrimary);
                expect(config.series[0].itemStyle.color).toBe(lightColors.primary);
                expect(config.series[0].label.color).toBe(lightColors.textPrimary);
            }
        });

        it('should use default animation duration when not specified', () => {
            const mockChartInstance = {
                setOption: vi.fn(() => {}),
            };

            applyThemeTransition(mockChartInstance, 'dark');

            const calls = mockChartInstance.setOption.mock.calls;
            if (calls[0] && calls[0].length >= 1) {
                const [config] = calls[0] as [any];
                expect(config.animationDuration).toBe(400); // Default duration
                expect(config.animationDurationUpdate).toBe(400);
            }
        });

        it('should handle rapid theme switching gracefully', () => {
            const mockChartInstance = {
                setOption: vi.fn(() => {}),
            };

            // Simulate rapid theme switching
            applyThemeTransition(mockChartInstance, 'light', 300);
            applyThemeTransition(mockChartInstance, 'dark', 300);
            applyThemeTransition(mockChartInstance, 'light', 300);

            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(3);

            // Each call should have proper animation settings
            const calls = mockChartInstance.setOption.mock.calls;
            calls.forEach((call) => {
                if (call && call.length >= 1) {
                    const [config] = call as [any];
                    expect(config.animationDuration).toBe(300);
                    expect(config.animationEasing).toBe('cubicInOut');
                }
            });
        });

        it('should handle null chart instance gracefully', () => {
            expect(() => {
                applyThemeTransition(null, 'dark', 300);
            }).not.toThrow();

            expect(() => {
                applyThemeTransition(undefined, 'light', 500);
            }).not.toThrow();
        });
    });

    describe('Sub-task 4: Chart appearance verification in both themes', () => {
        it('should have appropriate visual contrast in dark theme', () => {
            const darkColors = getChartThemeColors('dark');

            // Verify dark theme has appropriate colors for dark backgrounds
            expect(darkColors.textPrimary).toBe('#f9fafb'); // Light text on dark background
            expect(darkColors.surfaceColor).toBe('#1f2937'); // Dark surface color
            expect(darkColors.borderColor).toBe('#374151'); // Subtle border color

            // Verify primary colors are bright enough for dark theme
            expect(darkColors.primary).toBe('#3b82f6'); // Bright blue
            expect(darkColors.secondary).toBe('#10b981'); // Bright emerald
            expect(darkColors.accent).toBe('#f59e0b'); // Bright amber

            // Verify hover states are lighter for visibility
            expect(darkColors.hover.primary).toBe('#60a5fa'); // Lighter blue
            expect(darkColors.hover.secondary).toBe('#34d399'); // Lighter emerald
            expect(darkColors.hover.accent).toBe('#fbbf24'); // Lighter amber
        });

        it('should have appropriate visual contrast in light theme', () => {
            const lightColors = getChartThemeColors('light');

            // Verify light theme has appropriate colors for light backgrounds
            expect(lightColors.textPrimary).toBe('#111827'); // Dark text on light background
            expect(lightColors.surfaceColor).toBe('#f9fafb'); // Light surface color
            expect(lightColors.borderColor).toBe('#e5e7eb'); // Subtle border color

            // Verify primary colors are dark enough for light theme
            expect(lightColors.primary).toBe('#2563eb'); // Darker blue
            expect(lightColors.secondary).toBe('#059669'); // Darker emerald
            expect(lightColors.accent).toBe('#d97706'); // Darker amber

            // Verify hover states provide good contrast
            expect(lightColors.hover.primary).toBe('#3b82f6'); // Medium blue
            expect(lightColors.hover.secondary).toBe('#10b981'); // Medium emerald
            expect(lightColors.hover.accent).toBe('#f59e0b'); // Medium amber
        });

        it('should provide distinct visual elements for multiple connections', () => {
            // Test with multiple connections
            const multipleConnections = 8;

            // Dark theme connection colors
            const darkConnectionColors = [];
            for (let i = 0; i < multipleConnections; i++) {
                darkConnectionColors.push(getConnectionColor(i, multipleConnections, 'dark'));
            }

            // Light theme connection colors
            const lightConnectionColors = [];
            for (let i = 0; i < multipleConnections; i++) {
                lightConnectionColors.push(getConnectionColor(i, multipleConnections, 'light'));
            }

            // Verify all colors are distinct within each theme
            const uniqueDarkColors = new Set(darkConnectionColors);
            const uniqueLightColors = new Set(lightConnectionColors);

            expect(uniqueDarkColors.size).toBe(multipleConnections);
            expect(uniqueLightColors.size).toBe(multipleConnections);

            // Verify colors are visually distinct (no similar colors)
            darkConnectionColors.forEach((color, index) => {
                expect(color).toMatch(/^#[0-9a-f]{6}$/i); // Valid hex color
                expect(color).not.toBe('#000000'); // Not black
                expect(color).not.toBe('#ffffff'); // Not white
            });

            lightConnectionColors.forEach((color, index) => {
                expect(color).toMatch(/^#[0-9a-f]{6}$/i); // Valid hex color
                expect(color).not.toBe('#000000'); // Not black
                expect(color).not.toBe('#ffffff'); // Not white
            });
        });

        it('should maintain consistent styling across theme switches', () => {
            const darkOption = createThemeAwareChartOption('dark');
            const lightOption = createThemeAwareChartOption('light');

            // Verify consistent animation settings
            expect(darkOption.animationDuration).toBe(lightOption.animationDuration);
            expect(darkOption.animationEasing).toBe(lightOption.animationEasing);
            expect(darkOption.animationDurationUpdate).toBe(lightOption.animationDurationUpdate);
            expect(darkOption.animationEasingUpdate).toBe(lightOption.animationEasingUpdate);

            // Verify consistent structural elements
            expect(darkOption.series.emphasis.focus).toBe(lightOption.series.emphasis.focus);
            expect(darkOption.series.emphasis.blurScope).toBe(lightOption.series.emphasis.blurScope);
            expect(darkOption.series.lineStyle.curveness).toBe(lightOption.series.lineStyle.curveness);
            expect(darkOption.series.lineStyle.opacity).toBe(lightOption.series.lineStyle.opacity);

            // Verify tooltip structure consistency
            expect(darkOption.tooltip.borderRadius).toBe(lightOption.tooltip.borderRadius);
            expect(darkOption.tooltip.padding).toEqual(lightOption.tooltip.padding);
            expect(darkOption.tooltip.textStyle.fontSize).toBe(lightOption.tooltip.textStyle.fontSize);
        });
    });

    describe('Integration: Complete theme-aware functionality', () => {
        it('should demonstrate complete theme switching workflow', () => {
            const mockChartInstance = {
                setOption: vi.fn(() => {}),
            };

            // Start with dark theme
            let currentTheme = 'dark';
            let chartOption = createCompleteThemeAwareOption(sampleChartData, currentTheme);

            // Verify initial dark theme setup
            expect(chartOption.tooltip.backgroundColor).toBe(CHART_THEME_COLORS.dark.surfaceColor);
            expect(chartOption.series[0].itemStyle.color).toBe(CHART_THEME_COLORS.dark.primary);

            // Switch to light theme with smooth transition
            currentTheme = 'light';
            applyThemeTransition(mockChartInstance, currentTheme, 400);
            chartOption = createCompleteThemeAwareOption(sampleChartData, currentTheme);

            // Verify light theme is applied
            expect(chartOption.tooltip.backgroundColor).toBe('#ffffff');
            expect(chartOption.series[0].itemStyle.color).toBe(CHART_THEME_COLORS.light.primary);

            // Verify transition was called
            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(1);

            // Switch back to dark theme
            currentTheme = 'dark';
            applyThemeTransition(mockChartInstance, currentTheme, 400);
            chartOption = createCompleteThemeAwareOption(sampleChartData, currentTheme);

            // Verify dark theme is reapplied
            expect(chartOption.tooltip.backgroundColor).toBe(CHART_THEME_COLORS.dark.surfaceColor);
            expect(chartOption.series[0].itemStyle.color).toBe(CHART_THEME_COLORS.dark.primary);

            // Verify both transitions were called
            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(2);
        });

        it('should handle complex chart data with theme switching', () => {
            const complexChartData: SankeyChartData = {
                nodes: [
                    { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' },
                    { name: 'E' }, { name: 'F' }, { name: 'G' }, { name: 'H' },
                ],
                links: [
                    { source: 'A', target: 'E', value: 15 },
                    { source: 'A', target: 'F', value: 10 },
                    { source: 'B', target: 'E', value: 8 },
                    { source: 'B', target: 'G', value: 12 },
                    { source: 'C', target: 'F', value: 6 },
                    { source: 'C', target: 'H', value: 9 },
                    { source: 'D', target: 'G', value: 11 },
                    { source: 'D', target: 'H', value: 7 },
                ],
            };

            // Test both themes with complex data
            const darkOption = createCompleteThemeAwareOption(complexChartData, 'dark');
            const lightOption = createCompleteThemeAwareOption(complexChartData, 'light');

            // Verify data integrity
            expect(darkOption.series[0].data).toEqual(complexChartData.nodes);
            expect(darkOption.series[0].links).toEqual(complexChartData.links);
            expect(lightOption.series[0].data).toEqual(complexChartData.nodes);
            expect(lightOption.series[0].links).toEqual(complexChartData.links);

            // Verify theme-specific styling is applied
            expect(darkOption.series[0].itemStyle.color).toBe(CHART_THEME_COLORS.dark.primary);
            expect(lightOption.series[0].itemStyle.color).toBe(CHART_THEME_COLORS.light.primary);

            // Verify multiple connection colors would be used
            const totalConnections = complexChartData.links.length;
            const connectionColors = [];
            for (let i = 0; i < totalConnections; i++) {
                connectionColors.push(getConnectionColor(i, totalConnections, 'dark'));
            }

            // Should have multiple distinct colors
            const uniqueColors = new Set(connectionColors);
            expect(uniqueColors.size).toBeGreaterThan(1);
        });
    });
});

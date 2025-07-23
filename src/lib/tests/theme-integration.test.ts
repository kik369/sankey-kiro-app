/**
 * Integration tests for complete theme-aware chart functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChartThemeColors, applyThemeTransition } from '$lib/chart-themes';
import type { SankeyChartData } from '$lib/types';

describe('Theme Integration Tests', () => {
    let mockChartInstance: any;

    beforeEach(() => {
        mockChartInstance = {
            setOption: vi.fn(),
            resize: vi.fn(),
            dispose: vi.fn(),
        };
    });

    const sampleData: SankeyChartData = {
        nodes: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' }
        ],
        links: [
            { source: 'A', target: 'B', value: 10 },
            { source: 'B', target: 'C', value: 15 }
        ]
    };

    describe('Complete Theme Switching Workflow', () => {
        it('should handle theme switching from dark to light', () => {
            // Start with dark theme
            const darkColors = getChartThemeColors('dark');
            expect(darkColors.textPrimary).toBe('#f9fafb');
            expect(darkColors.primary).toBe('#3b82f6');

            // Apply dark theme transition
            applyThemeTransition(mockChartInstance, 'dark', 300);
            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(1);

            // Switch to light theme
            const lightColors = getChartThemeColors('light');
            expect(lightColors.textPrimary).toBe('#111827');
            expect(lightColors.primary).toBe('#2563eb');

            // Apply light theme transition
            applyThemeTransition(mockChartInstance, 'light', 300);
            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(2);

            // Verify the configurations are different
            const [darkConfig] = mockChartInstance.setOption.mock.calls[0];
            const [lightConfig] = mockChartInstance.setOption.mock.calls[1];

            expect(darkConfig.tooltip.textStyle.color).not.toBe(lightConfig.tooltip.textStyle.color);
            expect(darkConfig.series[0].itemStyle.color).not.toBe(lightConfig.series[0].itemStyle.color);
        });

        it('should handle theme switching from light to dark', () => {
            // Start with light theme
            applyThemeTransition(mockChartInstance, 'light', 300);
            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(1);

            // Switch to dark theme
            applyThemeTransition(mockChartInstance, 'dark', 300);
            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(2);

            // Verify both calls were made with different configurations
            const [lightConfig] = mockChartInstance.setOption.mock.calls[0];
            const [darkConfig] = mockChartInstance.setOption.mock.calls[1];

            expect(lightConfig.tooltip.backgroundColor).toBe('#ffffff');
            expect(darkConfig.tooltip.backgroundColor).toBe('#1f2937');
        });

        it('should maintain smooth transitions during rapid theme switching', () => {
            // Simulate rapid theme switching
            applyThemeTransition(mockChartInstance, 'dark', 200);
            applyThemeTransition(mockChartInstance, 'light', 200);
            applyThemeTransition(mockChartInstance, 'dark', 200);

            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(3);

            // All calls should have consistent animation settings
            mockChartInstance.setOption.mock.calls.forEach((call: any[]) => {
                const [config] = call;
                expect(config.animationDuration).toBe(200);
                expect(config.animationEasing).toBe('cubicInOut');
                expect(config.animationDurationUpdate).toBe(200);
            });
        });
    });

    describe('Theme Persistence and Consistency', () => {
        it('should maintain theme consistency across multiple chart updates', () => {
            const theme = 'dark';
            const colors = getChartThemeColors(theme);

            // Apply theme multiple times
            applyThemeTransition(mockChartInstance, theme, 300);
            applyThemeTransition(mockChartInstance, theme, 300);
            applyThemeTransition(mockChartInstance, theme, 300);

            // All configurations should be consistent
            mockChartInstance.setOption.mock.calls.forEach((call: any[]) => {
                const [config] = call;
                expect(config.tooltip.textStyle.color).toBe(colors.textPrimary);
                expect(config.series[0].itemStyle.color).toBe(colors.primary);
                expect(config.tooltip.backgroundColor).toBe(colors.surfaceColor);
            });
        });

        it('should handle edge cases gracefully', () => {
            // Test with null chart instance
            expect(() => {
                applyThemeTransition(null, 'dark', 300);
            }).not.toThrow();

            // Test with undefined chart instance
            expect(() => {
                applyThemeTransition(undefined, 'light', 300);
            }).not.toThrow();

            // Test with zero duration
            applyThemeTransition(mockChartInstance, 'dark', 0);
            const [config] = mockChartInstance.setOption.mock.calls[0];
            expect(config.animationDuration).toBe(0);
        });
    });

    describe('Visual Differentiation in Both Themes', () => {
        it('should provide distinct visual elements in dark theme', () => {
            const darkColors = getChartThemeColors('dark');

            // Verify visual hierarchy
            expect(darkColors.textPrimary).not.toBe(darkColors.textSecondary);
            expect(darkColors.textSecondary).not.toBe(darkColors.textMuted);

            // Verify interactive states
            expect(darkColors.hover.primary).not.toBe(darkColors.primary);
            expect(darkColors.emphasis.borderColor).toBeDefined();
            expect(darkColors.emphasis.shadowColor).toBeDefined();
        });

        it('should provide distinct visual elements in light theme', () => {
            const lightColors = getChartThemeColors('light');

            // Verify visual hierarchy
            expect(lightColors.textPrimary).not.toBe(lightColors.textSecondary);
            expect(lightColors.textSecondary).not.toBe(lightColors.textMuted);

            // Verify interactive states
            expect(lightColors.hover.primary).not.toBe(lightColors.primary);
            expect(lightColors.emphasis.borderColor).toBeDefined();
            expect(lightColors.emphasis.shadowColor).toBeDefined();
        });

        it('should handle multiple connections with visual differentiation', () => {
            const darkColors = getChartThemeColors('dark');
            const lightColors = getChartThemeColors('light');

            // Test with multiple connections
            const connections = Array.from({ length: 5 }, (_, i) => i);

            const darkConnectionColors = connections.map(i =>
                darkColors.connections[i % darkColors.connections.length]
            );
            const lightConnectionColors = connections.map(i =>
                lightColors.connections[i % lightColors.connections.length]
            );

            // All colors should be unique within the set
            expect(new Set(darkConnectionColors).size).toBe(5);
            expect(new Set(lightConnectionColors).size).toBe(5);

            // Colors should be different between themes
            expect(darkConnectionColors).not.toEqual(lightConnectionColors);
        });
    });

    describe('Performance and Optimization', () => {
        it('should use efficient animation settings', () => {
            applyThemeTransition(mockChartInstance, 'dark', 400);

            const [config, options] = mockChartInstance.setOption.mock.calls[0];

            // Verify efficient update strategy
            expect(options.notMerge).toBe(false);
            expect(options.lazyUpdate).toBe(false);
            expect(options.silent).toBe(false);
            expect(options.replaceMerge).toEqual(['tooltip', 'series']);

            // Verify reasonable animation duration
            expect(config.animationDuration).toBeGreaterThan(0);
            expect(config.animationDuration).toBeLessThan(1000);
        });

        it('should handle custom animation durations', () => {
            const customDurations = [100, 300, 500, 800];

            customDurations.forEach(duration => {
                applyThemeTransition(mockChartInstance, 'dark', duration);
            });

            // Verify each call used the correct duration
            mockChartInstance.setOption.mock.calls.forEach((call: any[], index: number) => {
                const [config] = call;
                expect(config.animationDuration).toBe(customDurations[index]);
                expect(config.animationDurationUpdate).toBe(customDurations[index]);
            });
        });
    });
});

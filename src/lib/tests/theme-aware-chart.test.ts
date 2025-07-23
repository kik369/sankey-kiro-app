/**
 * Tests for theme-aware chart styling functionality
 */

import { describe, it, expect, vi } from 'vitest';
import type { ThemeMode } from '$lib/types';
import {
    getChartThemeColors,
    getConnectionColor,
    createThemeAwareChartOption,
    applyThemeTransition,
    CHART_THEME_COLORS,
} from '$lib/chart-themes';

describe('Theme-Aware Chart Styling', () => {
    describe('Theme Color Configurations', () => {
        it('should provide correct dark theme colors', () => {
            const darkColors = getChartThemeColors('dark');

            expect(darkColors.primary).toBe('#3b82f6');
            expect(darkColors.secondary).toBe('#10b981');
            expect(darkColors.accent).toBe('#f59e0b');
            expect(darkColors.backgroundColor).toBe('transparent');
            expect(darkColors.textPrimary).toBe('#f9fafb');
            expect(darkColors.textMuted).toBe('#9ca3af');
            expect(darkColors.connections).toHaveLength(10);
        });

        it('should provide correct light theme colors', () => {
            const lightColors = getChartThemeColors('light');

            expect(lightColors.primary).toBe('#2563eb');
            expect(lightColors.secondary).toBe('#059669');
            expect(lightColors.accent).toBe('#d97706');
            expect(lightColors.backgroundColor).toBe('transparent');
            expect(lightColors.textPrimary).toBe('#111827');
            expect(lightColors.textMuted).toBe('#6b7280');
            expect(lightColors.connections).toHaveLength(10);
        });

        it('should have different color schemes for dark and light themes', () => {
            const darkColors = getChartThemeColors('dark');
            const lightColors = getChartThemeColors('light');

            expect(darkColors.primary).not.toBe(lightColors.primary);
            expect(darkColors.textPrimary).not.toBe(lightColors.textPrimary);
            expect(darkColors.surfaceColor).not.toBe(lightColors.surfaceColor);
        });
    });

    describe('Connection Color Differentiation', () => {
        it('should return primary color for single connection', () => {
            const darkColor = getConnectionColor(0, 1, 'dark');
            const lightColor = getConnectionColor(0, 1, 'light');

            expect(darkColor).toBe(CHART_THEME_COLORS.dark.primary);
            expect(lightColor).toBe(CHART_THEME_COLORS.light.primary);
        });

        it('should return different colors for multiple connections', () => {
            const colors = [];
            for (let i = 0; i < 5; i++) {
                colors.push(getConnectionColor(i, 5, 'dark'));
            }

            // All colors should be different
            const uniqueColors = new Set(colors);
            expect(uniqueColors.size).toBe(5);
        });

        it('should cycle through connection colors when exceeding available colors', () => {
            const totalConnections = 15; // More than available colors (10)
            const color1 = getConnectionColor(0, totalConnections, 'dark');
            const color11 = getConnectionColor(10, totalConnections, 'dark'); // Should be same as index 0

            expect(color1).toBe(color11);
        });
    });

    describe('Theme-Aware Chart Configuration', () => {
        it('should create correct dark theme configuration', () => {
            const config = createThemeAwareChartOption('dark');

            expect(config.backgroundColor).toBe('transparent');
            expect(config.animation).toBe(true);
            expect(config.animationDuration).toBe(400);
            expect(config.animationEasing).toBe('cubicOut');
            expect(config.tooltip.backgroundColor).toBe(CHART_THEME_COLORS.dark.surfaceColor);
            expect(config.tooltip.textStyle.color).toBe(CHART_THEME_COLORS.dark.textPrimary);
            expect(config.series.itemStyle.color).toBe(CHART_THEME_COLORS.dark.primary);
            expect(config.series.label.color).toBe(CHART_THEME_COLORS.dark.textPrimary);
        });

        it('should create correct light theme configuration', () => {
            const config = createThemeAwareChartOption('light');

            expect(config.backgroundColor).toBe('transparent');
            expect(config.animation).toBe(true);
            expect(config.tooltip.backgroundColor).toBe('#ffffff');
            expect(config.tooltip.textStyle.color).toBe(CHART_THEME_COLORS.light.textPrimary);
            expect(config.series.itemStyle.color).toBe(CHART_THEME_COLORS.light.primary);
            expect(config.series.label.color).toBe(CHART_THEME_COLORS.light.textPrimary);
        });

        it('should have different configurations for dark and light themes', () => {
            const darkConfig = createThemeAwareChartOption('dark');
            const lightConfig = createThemeAwareChartOption('light');

            expect(darkConfig.tooltip.backgroundColor).not.toBe(lightConfig.tooltip.backgroundColor);
            expect(darkConfig.tooltip.textStyle.color).not.toBe(lightConfig.tooltip.textStyle.color);
            expect(darkConfig.series.itemStyle.color).not.toBe(lightConfig.series.itemStyle.color);
        });
    });

    describe('Theme Transition Functionality', () => {
        it('should apply theme transition with correct duration', () => {
            const mockChartInstance = {
                setOption: vi.fn(() => {}),
            };

            applyThemeTransition(mockChartInstance, 'dark', 500);

            expect(mockChartInstance.setOption).toHaveBeenCalledTimes(1);
            const calls = mockChartInstance.setOption.mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            if (calls[0] && calls[0].length >= 2) {
                const callArgs = calls[0] as unknown as [any, any];
                const [config, options] = callArgs;

                expect(config.animationDuration).toBe(500);
                expect(config.animationDurationUpdate).toBe(500);
                expect(config.animationEasing).toBe('cubicInOut');
                expect(config.animationEasingUpdate).toBe('cubicInOut');
                expect(options.replaceMerge).toEqual(['tooltip', 'series']);
            }
        });

        it('should handle null chart instance gracefully', () => {
            expect(() => {
                applyThemeTransition(null, 'dark', 300);
            }).not.toThrow();
        });

        it('should use default duration when not specified', () => {
            const mockChartInstance = {
                setOption: vi.fn(() => {}),
            };

            applyThemeTransition(mockChartInstance, 'light');

            const calls = mockChartInstance.setOption.mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            if (calls[0] && calls[0].length >= 1) {
                const callArgs = calls[0] as unknown as [any];
                const [config] = callArgs;
                expect(config.animationDuration).toBe(400); // Default duration
            }
        });
    });

    describe('Visual Differentiation Features', () => {
        it('should handle theme-specific emphasis colors', () => {
            const darkConfig = createThemeAwareChartOption('dark');
            const lightConfig = createThemeAwareChartOption('light');

            expect(darkConfig.series.emphasis.itemStyle.borderColor).toBe(
                CHART_THEME_COLORS.dark.emphasis.borderColor
            );
            expect(lightConfig.series.emphasis.itemStyle.borderColor).toBe(
                CHART_THEME_COLORS.light.emphasis.borderColor
            );
        });

        it('should provide gradient colors for enhanced visual appeal', () => {
            const darkColors = getChartThemeColors('dark');
            const lightColors = getChartThemeColors('light');

            expect(darkColors.gradients.primary).toHaveLength(2);
            expect(darkColors.gradients.secondary).toHaveLength(2);
            expect(darkColors.gradients.accent).toHaveLength(2);

            expect(lightColors.gradients.primary).toHaveLength(2);
            expect(lightColors.gradients.secondary).toHaveLength(2);
            expect(lightColors.gradients.accent).toHaveLength(2);
        });

        it('should provide hover state colors for interactivity', () => {
            const darkColors = getChartThemeColors('dark');
            const lightColors = getChartThemeColors('light');

            expect(darkColors.hover.primary).toBeDefined();
            expect(darkColors.hover.secondary).toBeDefined();
            expect(darkColors.hover.accent).toBeDefined();
            expect(darkColors.hover.shadow).toBeDefined();

            expect(lightColors.hover.primary).toBeDefined();
            expect(lightColors.hover.secondary).toBeDefined();
            expect(lightColors.hover.accent).toBeDefined();
            expect(lightColors.hover.shadow).toBeDefined();
        });
    });
});

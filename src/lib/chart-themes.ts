/**
 * Theme-specific ECharts configurations for Sankey diagrams
 */

import type { ThemeMode } from '$lib/types';

/**
 * Comprehensive theme-specific color configurations for ECharts
 */
export const CHART_THEME_COLORS = {
    dark: {
        // Primary chart colors
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#f59e0b',

        // Background and surface colors
        backgroundColor: 'transparent',
        surfaceColor: '#1f2937',
        borderColor: '#374151',

        // Text colors
        textPrimary: '#f9fafb',
        textSecondary: '#d1d5db',
        textMuted: '#9ca3af',

        // Connection colors for visual differentiation
        connections: [
            '#3b82f6', // Blue
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Violet
            '#06b6d4', // Cyan
            '#84cc16', // Lime
            '#f97316', // Orange
            '#ec4899', // Pink
            '#6366f1', // Indigo
        ],

        // Gradient colors for enhanced visual appeal
        gradients: {
            primary: ['#3b82f6', '#1d4ed8'],
            secondary: ['#10b981', '#047857'],
            accent: ['#f59e0b', '#d97706'],
        },

        // Interactive state colors
        hover: {
            primary: '#60a5fa',
            secondary: '#34d399',
            accent: '#fbbf24',
            shadow: 'rgba(59, 130, 246, 0.4)',
        },

        // Emphasis and selection colors
        emphasis: {
            borderColor: '#60a5fa',
            shadowColor: 'rgba(59, 130, 246, 0.6)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
    },
    light: {
        // Primary chart colors
        primary: '#2563eb',
        secondary: '#059669',
        accent: '#d97706',

        // Background and surface colors
        backgroundColor: 'transparent',
        surfaceColor: '#f9fafb',
        borderColor: '#e5e7eb',

        // Text colors
        textPrimary: '#111827',
        textSecondary: '#374151',
        textMuted: '#6b7280',

        // Connection colors for visual differentiation
        connections: [
            '#2563eb', // Blue
            '#059669', // Emerald
            '#d97706', // Amber
            '#dc2626', // Red
            '#7c3aed', // Violet
            '#0891b2', // Cyan
            '#65a30d', // Lime
            '#ea580c', // Orange
            '#db2777', // Pink
            '#4f46e5', // Indigo
        ],

        // Gradient colors for enhanced visual appeal
        gradients: {
            primary: ['#2563eb', '#1e40af'],
            secondary: ['#059669', '#047857'],
            accent: ['#d97706', '#b45309'],
        },

        // Interactive state colors
        hover: {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#f59e0b',
            shadow: 'rgba(37, 99, 235, 0.4)',
        },

        // Emphasis and selection colors
        emphasis: {
            borderColor: '#3b82f6',
            shadowColor: 'rgba(37, 99, 235, 0.6)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
        },
    },
} as const;

/**
 * Get theme-specific colors
 */
export function getChartThemeColors(theme: ThemeMode) {
    return CHART_THEME_COLORS[theme];
}

/**
 * Get color for connection based on index and theme
 */
export function getConnectionColor(
    index: number,
    totalLinks: number,
    theme: ThemeMode
): string {
    const themeColors = getChartThemeColors(theme);

    // If we have multiple connections, use different colors for visual differentiation
    if (totalLinks > 1) {
        return themeColors.connections[index % themeColors.connections.length];
    }

    // Single connection uses the primary theme color
    return themeColors.primary;
}

/**
 * Create theme-aware ECharts configuration
 */
export function createThemeAwareChartOption(theme: ThemeMode) {
    const themeColors = getChartThemeColors(theme);
    const isDark = theme === 'dark';

    return {
        // Base theme configuration
        backgroundColor: themeColors.backgroundColor,

        // Animation configuration for smooth theme transitions
        animation: true,
        animationDuration: 400,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 300,
        animationEasingUpdate: 'cubicInOut',

        // Tooltip theme configuration
        tooltip: {
            backgroundColor: isDark ? themeColors.surfaceColor : '#ffffff',
            borderColor: themeColors.borderColor,
            borderWidth: 1,
            borderRadius: 8,
            padding: [10, 14],
            textStyle: {
                color: themeColors.textPrimary,
                fontSize: 13,
                fontWeight: 'normal',
                lineHeight: 1.4,
            },
            extraCssText: `
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'}),
                           0 4px 6px -2px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'});
                backdrop-filter: blur(12px);
                border-radius: 8px;
                max-width: 300px;
            `,
        },

        // Series base configuration
        series: {
            // Node styling
            itemStyle: {
                color: themeColors.primary,
                borderColor: themeColors.borderColor,
                borderWidth: 1,
                shadowBlur: 0,
                shadowColor: 'transparent',
            },

            // Label styling
            label: {
                color: themeColors.textPrimary,
                fontSize: 12,
                fontWeight: 'normal',
                position: 'right',
                distance: 8,
            },

            // Line styling
            lineStyle: {
                color: 'gradient',
                curveness: 0.5,
                opacity: 0.8,
            },

            // Emphasis states
            emphasis: {
                focus: 'adjacency',
                blurScope: 'coordinateSystem',
                itemStyle: {
                    borderWidth: 3,
                    shadowBlur: 15,
                    shadowColor: themeColors.emphasis.shadowColor,
                    borderColor: themeColors.emphasis.borderColor,
                },
                lineStyle: {
                    opacity: 1,
                    width: 6,
                    shadowBlur: 12,
                    shadowColor: themeColors.hover.shadow,
                    type: 'solid',
                },
                label: {
                    fontWeight: 'bold',
                    fontSize: 14,
                    color: themeColors.textPrimary,
                    backgroundColor: isDark
                        ? 'rgba(0, 0, 0, 0.7)'
                        : 'rgba(255, 255, 255, 0.9)',
                    padding: [4, 8],
                    borderRadius: 4,
                },
            },

            // Blur states
            blur: {
                itemStyle: {
                    opacity: 0.15,
                    shadowBlur: 0,
                },
                lineStyle: {
                    opacity: 0.08,
                    shadowBlur: 0,
                },
                label: {
                    opacity: 0.2,
                },
            },

            // Selection states
            select: {
                itemStyle: {
                    borderColor: themeColors.emphasis.borderColor,
                    borderWidth: 3,
                    shadowBlur: 10,
                    shadowColor: themeColors.hover.shadow,
                },
                lineStyle: {
                    opacity: 1,
                    width: 5,
                    shadowBlur: 8,
                    shadowColor: themeColors.hover.shadow,
                },
                label: {
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: themeColors.textPrimary,
                },
            },
        },
    };
}

/**
 * Apply smooth theme transition to chart instance
 */
export function applyThemeTransition(
    chartInstance: any,
    newTheme: ThemeMode,
    duration: number = 400
) {
    if (!chartInstance) return;

    const themeColors = getChartThemeColors(newTheme);
    const isDark = newTheme === 'dark';

    // Create transition-specific configuration with enhanced animations
    const transitionConfig = {
        // Enhanced animation configuration for theme transitions
        animation: true,
        animationDuration: duration,
        animationEasing: 'cubicInOut',
        animationDurationUpdate: duration,
        animationEasingUpdate: 'cubicInOut',

        // Background transition
        backgroundColor: themeColors.backgroundColor,

        // Tooltip theme transition with enhanced styling
        tooltip: {
            backgroundColor: isDark ? themeColors.surfaceColor : '#ffffff',
            borderColor: themeColors.borderColor,
            borderWidth: 1,
            borderRadius: 8,
            textStyle: {
                color: themeColors.textPrimary,
                fontSize: 13,
                fontWeight: 'normal',
                lineHeight: 1.4,
            },
            extraCssText: `
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'}),
                           0 4px 6px -2px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'});
                backdrop-filter: blur(12px);
                border-radius: 8px;
                max-width: 300px;
                transition: all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1);
            `,
        },

        // Series theme transition with comprehensive styling
        series: [{
            // Node styling with smooth transitions
            itemStyle: {
                color: themeColors.primary,
                borderColor: themeColors.borderColor,
                borderWidth: 1,
                shadowBlur: 0,
                shadowColor: 'transparent',
            },

            // Label styling with smooth transitions
            label: {
                color: themeColors.textPrimary,
                fontSize: 12,
                fontWeight: 'normal',
                position: 'right',
                distance: 8,
            },

            // Line styling with theme-aware colors
            lineStyle: {
                color: 'gradient',
                curveness: 0.5,
                opacity: 0.8,
            },

            // Enhanced emphasis states for theme transition
            emphasis: {
                focus: 'adjacency',
                blurScope: 'coordinateSystem',
                itemStyle: {
                    borderWidth: 3,
                    shadowBlur: 15,
                    shadowColor: themeColors.emphasis.shadowColor,
                    borderColor: themeColors.emphasis.borderColor,
                },
                lineStyle: {
                    opacity: 1,
                    width: 6,
                    shadowBlur: 12,
                    shadowColor: themeColors.hover.shadow,
                    type: 'solid',
                },
                label: {
                    fontWeight: 'bold',
                    fontSize: 14,
                    color: themeColors.textPrimary,
                    backgroundColor: isDark
                        ? 'rgba(0, 0, 0, 0.7)'
                        : 'rgba(255, 255, 255, 0.9)',
                    padding: [4, 8],
                    borderRadius: 4,
                },
            },

            // Enhanced blur states for better visual hierarchy
            blur: {
                itemStyle: {
                    opacity: 0.15,
                    shadowBlur: 0,
                },
                lineStyle: {
                    opacity: 0.08,
                    shadowBlur: 0,
                },
                label: {
                    opacity: 0.2,
                },
            },

            // Enhanced selection states
            select: {
                itemStyle: {
                    borderColor: themeColors.emphasis.borderColor,
                    borderWidth: 3,
                    shadowBlur: 10,
                    shadowColor: themeColors.hover.shadow,
                },
                lineStyle: {
                    opacity: 1,
                    width: 5,
                    shadowBlur: 8,
                    shadowColor: themeColors.hover.shadow,
                },
                label: {
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: themeColors.textPrimary,
                },
            },
        }],
    };

    // Apply theme transition with smooth animation
    chartInstance.setOption(transitionConfig, {
        notMerge: false,
        lazyUpdate: false,
        silent: false,
        replaceMerge: ['tooltip', 'series'],
    });
}

/**
 * Create comprehensive theme-aware chart option with all styling elements
 */
export function createCompleteThemeAwareOption(
    chartData: any,
    theme: ThemeMode,
    customOptions: any = {}
) {
    const baseOption = createThemeAwareChartOption(theme);
    const themeColors = getChartThemeColors(theme);
    const isDark = theme === 'dark';

    return {
        ...baseOption,
        ...customOptions,

        // Ensure all chart elements are theme-aware
        series: [{
            type: 'sankey',
            data: chartData.nodes,
            links: chartData.links,

            // Apply theme-aware styling to all elements
            ...baseOption.series,

            // Enhanced node styling
            itemStyle: {
                ...baseOption.series.itemStyle,
                color: themeColors.primary,
                borderColor: themeColors.borderColor,
            },

            // Enhanced label styling
            label: {
                ...baseOption.series.label,
                color: themeColors.textPrimary,
            },

            // Enhanced line styling
            lineStyle: {
                ...baseOption.series.lineStyle,
                color: 'gradient',
            },

            // Layout and positioning
            left: '5%',
            right: '5%',
            top: '5%',
            bottom: '5%',
            nodeWidth: 20,
            nodeGap: 8,
            layoutIterations: 32,
            draggable: false,
        }],
    };
}

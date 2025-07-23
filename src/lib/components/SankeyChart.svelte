<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as echarts from 'echarts';
    import type { SankeyChartData, SankeyLink, ThemeMode } from '$lib/types';
    import {
        getChartThemeColors,
        getConnectionColor,
        applyThemeTransition,
    } from '$lib/chart-themes';

    // Props
    let {
        data,
        theme = 'dark',
        width = '100%',
        height = '400px',
    } = $props<{
        data: SankeyChartData;
        theme?: ThemeMode;
        width?: string;
        height?: string;
    }>();

    // Responsive height calculation
    let containerElement = $state<HTMLDivElement>();
    let responsiveHeight = $state(height);

    // Chart instance and container
    let chartContainer = $state<HTMLDivElement>();
    let chartInstance: echarts.ECharts | null = null;
    let isInitialized = $state(false);
    let updateTimeoutId: number | null = null;

    // Import performance utilities
    import { PERFORMANCE_LIMITS } from '$lib/utils/performance-limits.js';
    import { debounce, throttle } from '$lib/utils/debounce.js';

    // Performance constants
    const DEBOUNCE_DELAY = PERFORMANCE_LIMITS.DEBOUNCE_DELAY;
    const CHART_UPDATE_DELAY = PERFORMANCE_LIMITS.CHART_UPDATE_DELAY;

    // Function to get enhanced visual differentiation for multiple connections
    function getConnectionStyle(
        link: SankeyLink,
        index: number,
        totalLinks: number,
        currentTheme: ThemeMode
    ) {
        const baseColor = getConnectionColor(index, totalLinks, currentTheme);

        // Enhanced visual differentiation for multiple connections
        if (totalLinks > 1) {
            return {
                color: baseColor,
                opacity: 0.85,
                width: Math.max(2, Math.min(8, link.value / 2)), // Dynamic width based on value
                curveness: 0.5 + (index % 3) * 0.1, // Slight curveness variation
                shadowBlur: 4,
                shadowColor: baseColor + '40', // Semi-transparent shadow
            };
        }

        return {
            color: baseColor,
            opacity: 0.8,
            width: 3,
            curveness: 0.5,
            shadowBlur: 2,
            shadowColor: baseColor + '30',
        };
    }

    // Function to calculate dynamic line width based on value and total flow
    function calculateLineWidth(
        value: number,
        maxValue: number,
        minWidth = 2,
        maxWidth = 12
    ): number {
        if (maxValue === 0) return minWidth;
        const ratio = value / maxValue;
        return Math.max(
            minWidth,
            Math.min(maxWidth, minWidth + (maxWidth - minWidth) * ratio)
        );
    }

    // Function to get connection pattern for visual differentiation
    function getConnectionPattern(
        index: number,
        totalConnections: number
    ): string {
        if (totalConnections <= 1) return 'solid';

        const patterns = ['solid', 'dashed', 'dotted'];
        return patterns[index % patterns.length];
    }

    // Chart configuration based on theme
    function getChartOption(
        chartData: SankeyChartData,
        currentTheme: ThemeMode
    ) {
        const themeColors = getChartThemeColors(currentTheme);
        const isDark = currentTheme === 'dark';

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
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
                formatter: function (params: any) {
                    if (params.dataType === 'node') {
                        // Enhanced node tooltip with detailed connection information
                        const nodeConnections = chartData.links.filter(
                            link =>
                                link.source === params.name ||
                                link.target === params.name
                        );
                        const incomingConnections = chartData.links.filter(
                            link => link.target === params.name
                        );
                        const outgoingConnections = chartData.links.filter(
                            link => link.source === params.name
                        );

                        const incomingValue = incomingConnections.reduce(
                            (sum, link) => sum + link.value,
                            0
                        );
                        const outgoingValue = outgoingConnections.reduce(
                            (sum, link) => sum + link.value,
                            0
                        );
                        const totalValue = chartData.links.reduce(
                            (sum, link) => sum + link.value,
                            0
                        );

                        let tooltipContent = `
                            <div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">${params.name}</div>
                            <div style="font-size: 12px; line-height: 1.5;">
                                <div style="margin-bottom: 4px;">
                                    <span style="color: ${themeColors.textMuted};">Total Connections:</span>
                                    <span style="font-weight: bold;">${nodeConnections.length}</span>
                                </div>
                        `;

                        if (incomingValue > 0) {
                            const incomingPercentage =
                                totalValue > 0
                                    ? (
                                          (incomingValue / totalValue) *
                                          100
                                      ).toFixed(1)
                                    : '0';
                            tooltipContent += `
                                <div style="margin-bottom: 4px;">
                                    <span style="color: ${themeColors.secondary};">↓ Incoming:</span>
                                    <span style="font-weight: bold;">${incomingValue}</span>
                                    <span style="color: ${themeColors.textMuted}; font-size: 11px;"> (${incomingPercentage}%)</span>
                                </div>
                            `;
                        }

                        if (outgoingValue > 0) {
                            const outgoingPercentage =
                                totalValue > 0
                                    ? (
                                          (outgoingValue / totalValue) *
                                          100
                                      ).toFixed(1)
                                    : '0';
                            tooltipContent += `
                                <div style="margin-bottom: 4px;">
                                    <span style="color: ${themeColors.accent};">↑ Outgoing:</span>
                                    <span style="font-weight: bold;">${outgoingValue}</span>
                                    <span style="color: ${themeColors.textMuted}; font-size: 11px;"> (${outgoingPercentage}%)</span>
                                </div>
                            `;
                        }

                        // Show connected nodes for better context
                        if (nodeConnections.length > 0) {
                            const connectedNodes = [
                                ...new Set([
                                    ...incomingConnections.map(
                                        link => link.source
                                    ),
                                    ...outgoingConnections.map(
                                        link => link.target
                                    ),
                                ]),
                            ];

                            if (connectedNodes.length > 0) {
                                tooltipContent += `
                                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid ${isDark ? '#4b5563' : '#e5e7eb'};">
                                        <span style="color: ${isDark ? '#9ca3af' : '#6b7280'}; font-size: 11px;">Connected to: ${connectedNodes.slice(0, 3).join(', ')}${connectedNodes.length > 3 ? '...' : ''}</span>
                                    </div>
                                `;
                            }
                        }

                        tooltipContent += '</div>';
                        return tooltipContent;
                    } else if (params.dataType === 'edge') {
                        // Enhanced edge tooltip with comprehensive flow information
                        const totalValue = chartData.links.reduce(
                            (sum, link) => sum + link.value,
                            0
                        );
                        const percentage =
                            totalValue > 0
                                ? ((params.value / totalValue) * 100).toFixed(1)
                                : '0';

                        // Find other connections from the same source or to the same target
                        const sameSourceConnections = chartData.links.filter(
                            link =>
                                link.source === params.source &&
                                link.target !== params.target
                        );
                        const sameTargetConnections = chartData.links.filter(
                            link =>
                                link.target === params.target &&
                                link.source !== params.source
                        );

                        let tooltipContent = `
                            <div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">
                                <span style="color: ${isDark ? '#60a5fa' : '#3b82f6'};">${params.source}</span>
                                <span style="color: ${isDark ? '#9ca3af' : '#6b7280'}; margin: 0 4px;">→</span>
                                <span style="color: ${isDark ? '#34d399' : '#10b981'};">${params.target}</span>
                            </div>
                            <div style="font-size: 12px; line-height: 1.5;">
                                <div style="margin-bottom: 4px;">
                                    <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">Flow Value:</span>
                                    <span style="font-weight: bold; font-size: 13px;">${params.value}</span>
                                </div>
                                <div style="margin-bottom: 4px;">
                                    <span style="color: ${isDark ? '#9ca3af' : '#6b7280'};">Share of Total:</span>
                                    <span style="font-weight: bold; color: ${isDark ? '#fbbf24' : '#f59e0b'};">${percentage}%</span>
                                </div>
                        `;

                        // Add context about other connections
                        if (sameSourceConnections.length > 0) {
                            tooltipContent += `
                                <div style="margin-top: 6px; font-size: 11px; color: ${isDark ? '#9ca3af' : '#6b7280'};">
                                    ${params.source} also flows to: ${sameSourceConnections
                                        .slice(0, 2)
                                        .map(link => link.target)
                                        .join(
                                            ', '
                                        )}${sameSourceConnections.length > 2 ? '...' : ''}
                                </div>
                            `;
                        }

                        if (sameTargetConnections.length > 0) {
                            tooltipContent += `
                                <div style="margin-top: 2px; font-size: 11px; color: ${isDark ? '#9ca3af' : '#6b7280'};">
                                    ${params.target} also receives from: ${sameTargetConnections
                                        .slice(0, 2)
                                        .map(link => link.source)
                                        .join(
                                            ', '
                                        )}${sameTargetConnections.length > 2 ? '...' : ''}
                                </div>
                            `;
                        }

                        tooltipContent += '</div>';
                        return tooltipContent;
                    }
                    return '';
                },
                extraCssText: `
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    backdrop-filter: blur(12px);
                    border-radius: 8px;
                    max-width: 300px;
                `,
            },
            series: [
                {
                    type: 'sankey',
                    data: chartData.nodes,
                    links: chartData.links.map((link, index) => {
                        const maxValue = Math.max(
                            ...chartData.links.map(l => l.value)
                        );
                        const connectionStyle = getConnectionStyle(
                            link,
                            index,
                            chartData.links.length,
                            currentTheme
                        );

                        return {
                            ...link,
                            // Enhanced visual differentiation for multiple connections
                            lineStyle: {
                                ...connectionStyle,
                                width: calculateLineWidth(link.value, maxValue),
                                type: getConnectionPattern(
                                    index,
                                    chartData.links.length
                                ),
                            },
                        };
                    }),
                    emphasis: {
                        focus: 'adjacency',
                        blurScope: 'coordinateSystem',
                        itemStyle: {
                            borderWidth: 3,
                            shadowBlur: 15,
                            shadowColor: isDark
                                ? 'rgba(59, 130, 246, 0.6)'
                                : 'rgba(37, 99, 235, 0.6)',
                            borderColor: isDark ? '#60a5fa' : '#3b82f6',
                        },
                        lineStyle: {
                            opacity: 1,
                            width: 6,
                            shadowBlur: 12,
                            shadowColor: isDark
                                ? 'rgba(59, 130, 246, 0.4)'
                                : 'rgba(37, 99, 235, 0.4)',
                            type: 'solid', // Override pattern on emphasis
                        },
                        label: {
                            fontWeight: 'bold',
                            fontSize: 14,
                            color: isDark ? '#ffffff' : '#000000',
                            backgroundColor: isDark
                                ? 'rgba(0, 0, 0, 0.7)'
                                : 'rgba(255, 255, 255, 0.9)',
                            padding: [4, 8],
                            borderRadius: 4,
                        },
                    },
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
                    select: {
                        itemStyle: {
                            borderColor: isDark ? '#60a5fa' : '#3b82f6',
                            borderWidth: 3,
                            shadowBlur: 10,
                            shadowColor: isDark
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                        },
                        lineStyle: {
                            opacity: 1,
                            width: 5,
                            shadowBlur: 8,
                            shadowColor: isDark
                                ? 'rgba(96, 165, 250, 0.3)'
                                : 'rgba(59, 130, 246, 0.3)',
                        },
                        label: {
                            fontWeight: 'bold',
                            fontSize: 13,
                            color: isDark ? '#ffffff' : '#000000',
                        },
                    },
                    lineStyle: {
                        color: 'gradient',
                        curveness: 0.5,
                        opacity: 0.8,
                    },
                    // Enable smooth animations for data changes
                    animation: true,
                    animationDuration: 400,
                    animationEasing: 'cubicOut',
                    animationDelay: (idx: number) => idx * 30, // Staggered animation
                    animationDurationUpdate: 300,
                    animationEasingUpdate: 'cubicInOut',
                    itemStyle: {
                        color: isDark ? '#3b82f6' : '#2563eb',
                        borderColor: isDark ? '#1e40af' : '#1d4ed8',
                        borderWidth: 1,
                        shadowBlur: 0,
                        shadowColor: 'transparent',
                    },
                    label: {
                        color: isDark ? '#f9fafb' : '#111827',
                        fontSize: 12,
                        fontWeight: 'normal',
                        position: 'right',
                        distance: 8,
                    },
                    left:
                        typeof window !== 'undefined' && window.innerWidth < 640
                            ? '2%'
                            : '5%',
                    right:
                        typeof window !== 'undefined' && window.innerWidth < 640
                            ? '2%'
                            : '5%',
                    top:
                        typeof window !== 'undefined' && window.innerWidth < 640
                            ? '3%'
                            : '5%',
                    bottom:
                        typeof window !== 'undefined' && window.innerWidth < 640
                            ? '3%'
                            : '5%',
                    nodeWidth:
                        typeof window !== 'undefined' && window.innerWidth < 640
                            ? 15
                            : 20,
                    nodeGap:
                        typeof window !== 'undefined' && window.innerWidth < 640
                            ? 6
                            : 8,
                    layoutIterations: 32,
                    // Enable node dragging for better interactivity
                    draggable: false, // Disabled to prevent accidental layout changes
                },
            ],
        };
    }

    // Initialize chart
    function initChart() {
        if (!chartContainer || chartInstance) return;

        try {
            chartInstance = echarts.init(chartContainer);
            isInitialized = true;
            updateChart();
        } catch (error) {
            console.error('Failed to initialize ECharts:', error);
        }
    }

    // Update chart with new data (with performance optimizations)
    function updateChart() {
        if (!chartInstance || !isInitialized) return;

        try {
            const option = getChartOption(data, theme);

            // Performance optimization: use different update strategies based on data size
            const nodeCount = data.nodes.length;
            const linkCount = data.links.length;
            const isLargeDataset = nodeCount > 30 || linkCount > 60;

            // Use optimized settings for large datasets
            chartInstance.setOption(option, {
                notMerge: isLargeDataset, // Don't merge for large datasets to avoid memory issues
                lazyUpdate: isLargeDataset, // Use lazy updates for large datasets
                silent: isLargeDataset, // Reduce event overhead for large datasets
                replaceMerge: ['series'],
            });

            // Throttled resize for better performance
            throttledResize();
        } catch (error) {
            console.error('Failed to update chart:', error);
        }
    }

    // Optimized debounced chart update function
    const debouncedUpdateChart = debounce(() => {
        updateChart();
    }, DEBOUNCE_DELAY);

    // Throttled resize handler for better performance
    const throttledResize = throttle(() => {
        if (chartInstance && isInitialized) {
            chartInstance.resize();
        }
    }, 100);

    // Cleanup chart instance
    function destroyChart() {
        if (chartInstance) {
            try {
                chartInstance.dispose();
                chartInstance = null;
                isInitialized = false;
            } catch (error) {
                console.error('Failed to dispose chart:', error);
            }
        }
    }

    // Calculate responsive height based on screen size
    function calculateResponsiveHeight(): string {
        if (typeof window === 'undefined') return height;

        const screenWidth = window.innerWidth;

        // Mobile: smaller height to fit screen better
        if (screenWidth < 640) {
            return '300px';
        }
        // Tablet: medium height
        else if (screenWidth < 1024) {
            return '350px';
        }
        // Desktop: full height
        else {
            return height;
        }
    }

    // Optimized resize handler
    const handleResize = throttle(() => {
        if (chartInstance && isInitialized) {
            // Update responsive height
            responsiveHeight = calculateResponsiveHeight();

            // Use throttled resize for better performance
            setTimeout(() => {
                throttledResize();
            }, CHART_UPDATE_DELAY);
        }
    }, 200); // Throttle resize events

    // Lifecycle hooks
    onMount(() => {
        // Set initial responsive height
        responsiveHeight = calculateResponsiveHeight();

        initChart();

        // Add resize listener
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    onDestroy(() => {
        destroyChart();
    });

    // Optimized real-time data updates with performance monitoring
    $effect(() => {
        // Watch for data changes (nodes and links)
        const nodeCount = data.nodes.length;
        const linkCount = data.links.length;

        if (isInitialized) {
            // Use different update strategies based on data complexity
            if (
                nodeCount > PERFORMANCE_LIMITS.WARNING_NODES ||
                linkCount > PERFORMANCE_LIMITS.WARNING_CONNECTIONS
            ) {
                // For large datasets, use longer debounce delay
                const largeDebouncedUpdate = debounce(() => {
                    updateChart();
                }, DEBOUNCE_DELAY * 2);
                largeDebouncedUpdate();
            } else {
                // For smaller datasets, use normal debounce
                debouncedUpdateChart();
            }
        }
    });

    // Theme change effect with smooth transitions
    $effect(() => {
        // Watch for theme changes
        theme;

        if (isInitialized && chartInstance) {
            // Apply smooth theme transition
            applyThemeTransition(chartInstance, theme, 400);

            // Then update the chart with new theme-aware configuration
            setTimeout(() => {
                updateChart();
            }, 50); // Small delay to allow theme transition to start
        }
    });
</script>

<div class="sankey-chart-container">
    {#if data.nodes.length === 0 || data.links.length === 0}
        <!-- Empty state -->
        <div
            class="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
            style="width: {width}; height: {responsiveHeight};"
        >
            <div class="text-center">
                <div class="text-gray-400 dark:text-gray-500 mb-2">
                    <svg
                        class="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        ></path>
                    </svg>
                </div>
                <h3
                    class="text-lg font-medium text-gray-900 dark:text-white mb-1"
                >
                    No Data to Display
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Add some flow data to see your Sankey diagram
                </p>
            </div>
        </div>
    {:else}
        <!-- Chart container -->
        <div
            bind:this={chartContainer}
            class="sankey-chart bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            style="width: {width}; height: {responsiveHeight};"
        ></div>
    {/if}
</div>

<style>
    .sankey-chart-container {
        position: relative;
    }

    .sankey-chart {
        transition: border-color 0.2s ease-in-out;
    }
</style>

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as echarts from 'echarts';
    import type { SankeyChartData, SankeyLink, ThemeMode } from '../types';
    import {
        getChartThemeColors,
        getConnectionColor,
        applyThemeTransition,
    } from '../chart-themes';
    import { errorHandler, safeExecute } from '../utils/error-handler';

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

    // Chart state
    let chartContainer: HTMLDivElement | undefined = $state();
    let chartInstance: echarts.ECharts | null = $state(null);
    let chartError = $state<string | null>(null);

    // Function to get chart options
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
                formatter: (params: any) => {
                    if (params.dataType === 'edge') {
                        return `${params.data.source} → ${params.data.target}: ${params.data.value}`;
                    }
                    return params.name;
                },
            },
            series: [
                {
                    type: 'sankey',
                    data: chartData.nodes,
                    links: chartData.links,
                    emphasis: {
                        focus: 'adjacency',
                    },
                    lineStyle: {
                        color: 'gradient',
                        curveness: 0.5,
                    },
                    label: {
                        color: isDark ? '#fff' : '#000',
                    },
                },
            ],
        };
    }

    // Initialize the chart
    async function initChart() {
        if (!chartContainer) return;

        const result = await safeExecute(() => {
            chartInstance = echarts.init(chartContainer);
            return true;
        }, 'chart_initialization');

        if (result) {
            await updateChart();
        } else {
            chartError = 'Failed to initialize the chart. Please try again.';
        }
    }

    // Update the chart with new data
    async function updateChart() {
        if (!chartInstance) return;

        const result = await safeExecute(() => {
            if (!data || !data.nodes || !data.links) {
                throw new Error('Invalid chart data provided.');
            }
            const option = getChartOption(data, theme);
            chartInstance?.setOption(option);
            return true;
        }, 'chart_update');

        if (!result) {
            chartError =
                'Failed to update the chart. Please check the data and try again.';
        }
    }

    // Cleanup on destroy
    onDestroy(() => {
        chartInstance?.dispose();
    });

    // Lifecycle hooks
    onMount(() => {
        initChart();
    });

    // Reactive effects
    $effect(() => {
        if (chartInstance) {
            updateChart();
        }
    });

    $effect(() => {
        if (chartInstance) {
            const option = getChartOption(data, theme);
            chartInstance.setOption(option);
        }
    });
</script>

<div class="w-full h-full">
    {#if chartError}
        <div
            class="flex items-center justify-center w-full h-full bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-300 dark:border-red-600 rounded-lg"
        >
            <div class="text-center p-4">
                <svg
                    class="mx-auto h-12 w-12 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h3
                    class="mt-2 text-sm font-medium text-red-800 dark:text-red-200"
                >
                    Chart Error
                </h3>
                <p class="mt-1 text-sm text-red-600 dark:text-red-300">
                    {chartError}
                </p>
                <button
                    onclick={() => window.location.reload()}
                    class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors duration-200"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    {:else}
        <div
            bind:this={chartContainer}
            style="width: {width}; height: {height};"
        ></div>
    {/if}
</div>

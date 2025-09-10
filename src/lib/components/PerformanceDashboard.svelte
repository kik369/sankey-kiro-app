<script lang="ts">
    import type { FlowData } from '../types.js';
    import { performanceMonitor } from '../utils/performance-monitor.js';
    import { PERFORMANCE_LIMITS } from '../utils/performance-limits.js';

    // Props
    let {
        flows,
        showDetails = false,
    }: {
        flows: FlowData[];
        showDetails?: boolean;
    } = $props();

    // Performance state
    let performanceStatus = $state(performanceMonitor.getPerformanceStatus());
    let performanceTrends = $state(performanceMonitor.getPerformanceTrends());
    let showDashboard = $state(false);

    // Update performance status periodically
    let updateInterval = $state<number | null>(null);

    $effect(() => {
        // Update performance status when flows change
        flows;
        performanceStatus = performanceMonitor.getPerformanceStatus();
        performanceTrends = performanceMonitor.getPerformanceTrends();
    });

    function startPerformanceMonitoring() {
        if (updateInterval) return;

        updateInterval = setInterval(() => {
            performanceStatus = performanceMonitor.getPerformanceStatus();
            performanceTrends = performanceMonitor.getPerformanceTrends();
        }, 1000);
    }

    function stopPerformanceMonitoring() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    function clearPerformanceHistory() {
        performanceMonitor.clearHistory();
        performanceStatus = performanceMonitor.getPerformanceStatus();
        performanceTrends = performanceMonitor.getPerformanceTrends();
    }

    // Cleanup on destroy
    $effect(() => {
        return () => {
            stopPerformanceMonitoring();
        };
    });

    // Helper functions
    function getStatusColor(isHealthy: boolean): string {
        return isHealthy
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400';
    }

    function getTrendIconPath(
        trend: 'improving' | 'stable' | 'degrading'
    ): string {
        switch (trend) {
            case 'improving':
                return 'M4 16l6-6 6 6'; // up-right arrow
            case 'degrading':
                return 'M4 8l6 6 6-6'; // down-right arrow
            default:
                return 'M4 12h12'; // horizontal line
        }
    }

    function getTrendColor(
        trend: 'improving' | 'stable' | 'degrading'
    ): string {
        switch (trend) {
            case 'improving':
                return 'text-green-600 dark:text-green-400';
            case 'degrading':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    }
</script>

{#if showDetails}
    <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
    >
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Performance Monitor
            </h3>
            <div class="flex items-center space-x-2">
                <button
                    onclick={() => (showDashboard = !showDashboard)}
                    class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    {showDashboard ? 'Hide' : 'Show'} Details
                </button>
                {#if !updateInterval}
                    <button
                        onclick={startPerformanceMonitoring}
                        class="px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                    >
                        Start Monitoring
                    </button>
                {:else}
                    <button
                        onclick={stopPerformanceMonitoring}
                        class="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Stop Monitoring
                    </button>
                {/if}
                <button
                    onclick={clearPerformanceHistory}
                    class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Clear History
                </button>
            </div>
        </div>

        <!-- Performance Status Overview -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="text-center">
                <div
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700"
                >
                    {#if performanceStatus.isHealthy}
                        <svg
                            class="w-6 h-6 {getStatusColor(true)}"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    {:else}
                        <svg
                            class="w-6 h-6 {getStatusColor(false)}"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01M4.93 19h14.14c1.2 0 1.97-1.3 1.36-2.35L13.36 5.65a1.5 1.5 0 00-2.72 0L3.57 16.65C2.96 17.7 3.73 19 4.93 19z"
                            />
                        </svg>
                    {/if}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    {performanceStatus.isHealthy ? 'Healthy' : 'Issues'}
                </div>
            </div>

            {#if performanceStatus.current}
                <div class="text-center">
                    <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                        {performanceStatus.current.nodeCount}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Nodes ({PERFORMANCE_LIMITS.MAX_NODES} max)
                    </div>
                </div>

                <div class="text-center">
                    <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                        {performanceStatus.current.connectionCount}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Connections ({PERFORMANCE_LIMITS.MAX_CONNECTIONS} max)
                    </div>
                </div>

                <div class="text-center">
                    <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                        {performanceStatus.current.memoryUsage.toFixed(1)}MB
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Memory Usage
                    </div>
                </div>
            {/if}
        </div>

        <!-- Performance Warnings -->
        {#if performanceStatus.warnings.length > 0}
            <div
                class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
            >
                <h4
                    class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2"
                >
                    Performance Warnings:
                </h4>
                <ul
                    class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1"
                >
                    {#each performanceStatus.warnings as warning}
                        <li>• {warning}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        <!-- Detailed Dashboard -->
        {#if showDashboard}
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4
                    class="text-md font-semibold text-gray-900 dark:text-white mb-3"
                >
                    Performance Metrics
                </h4>

                {#if performanceStatus.current && Object.keys(performanceStatus.average).length > 0}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Transform Time -->
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                            <div class="flex items-center justify-between mb-2">
                                <span
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Transform Time
                                </span>
                                <span
                                    class="{getTrendColor(
                                        performanceTrends.transformTimetrend
                                    )} text-sm"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d={getTrendIconPath(
                                                performanceTrends.transformTimetrend
                                            )}
                                        />
                                    </svg>
                                </span>
                            </div>
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                {performanceStatus.current.transformTime.toFixed(
                                    1
                                )}ms
                            </div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400"
                            >
                                Avg: {performanceStatus.average.transformTime?.toFixed(
                                    1
                                ) || 0}ms
                            </div>
                        </div>

                        <!-- Render Time -->
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                            <div class="flex items-center justify-between mb-2">
                                <span
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Render Time
                                </span>
                                <span
                                    class="{getTrendColor(
                                        performanceTrends.renderTimetrend
                                    )} text-sm"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d={getTrendIconPath(
                                                performanceTrends.renderTimetrend
                                            )}
                                        />
                                    </svg>
                                </span>
                            </div>
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                {performanceStatus.current.renderTime.toFixed(
                                    1
                                )}ms
                            </div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400"
                            >
                                Avg: {performanceStatus.average.renderTime?.toFixed(
                                    1
                                ) || 0}ms
                            </div>
                        </div>

                        <!-- Memory Usage -->
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                            <div class="flex items-center justify-between mb-2">
                                <span
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Memory Usage
                                </span>
                                <span
                                    class="{getTrendColor(
                                        performanceTrends.memoryTrend
                                    )} text-sm"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d={getTrendIconPath(
                                                performanceTrends.memoryTrend
                                            )}
                                        />
                                    </svg>
                                </span>
                            </div>
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                {performanceStatus.current.memoryUsage.toFixed(
                                    1
                                )}MB
                            </div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400"
                            >
                                Avg: {performanceStatus.average.memoryUsage?.toFixed(
                                    1
                                ) || 0}MB
                            </div>
                        </div>

                        <!-- Update Frequency -->
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                            <div class="flex items-center justify-between mb-2">
                                <span
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Update Frequency
                                </span>
                                <span
                                    class="text-gray-600 dark:text-gray-400 text-sm"
                                >
                                    /sec
                                </span>
                            </div>
                            <div
                                class="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                {performanceStatus.current.updateFrequency}
                            </div>
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400"
                            >
                                Avg: {performanceStatus.average.updateFrequency?.toFixed(
                                    1
                                ) || 0}/sec
                            </div>
                        </div>
                    </div>

                    <!-- Performance Limits -->
                    <div
                        class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
                    >
                        <h5
                            class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2"
                        >
                            Performance Limits
                        </h5>
                        <div
                            class="grid grid-cols-2 gap-4 text-xs text-blue-700 dark:text-blue-300"
                        >
                            <div>Max Nodes: {PERFORMANCE_LIMITS.MAX_NODES}</div>
                            <div>
                                Max Connections: {PERFORMANCE_LIMITS.MAX_CONNECTIONS}
                            </div>
                            <div>
                                Debounce Delay: {PERFORMANCE_LIMITS.DEBOUNCE_DELAY}ms
                            </div>
                            <div>
                                Chart Update Delay: {PERFORMANCE_LIMITS.CHART_UPDATE_DELAY}ms
                            </div>
                        </div>
                    </div>
                {:else}
                    <div
                        class="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                        <p>No performance data available yet.</p>
                        <p class="text-sm mt-1">
                            Start monitoring to see real-time metrics.
                        </p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

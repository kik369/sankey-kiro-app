<script lang="ts">
    import { onMount } from 'svelte';
    import type { FlowData } from '$lib/types';
    import { transformFlowsToSankeyData } from '$lib/transform';
    import { themeStore } from '$lib/stores/theme.svelte';
    import SankeyChart from '$lib/components/SankeyChart.svelte';
    import DataInput from '$lib/components/DataInput.svelte';
    import ControlPanel from '$lib/components/ControlPanel.svelte';
    import PerformanceDashboard from '$lib/components/PerformanceDashboard.svelte';
    import { addStylingTest } from '$lib/utils/styling-diagnostics.js';

    // Flow data state
    let flows = $state([] as FlowData[]);
    let initialized = $state(false);

    // Derived chart data - this will trigger real-time updates
    let chartData = $derived(transformFlowsToSankeyData(flows));

    // Initialize on mount
    onMount(() => {
        themeStore.initialize();
        initialized = true;

        // Add styling diagnostics in development
        if (import.meta.env.DEV) {
            setTimeout(() => addStylingTest(), 1000);
        }
    });

    function handleClearAll() {
        flows = [];
    }

    function handleFlowsChange(newFlows: FlowData[]) {
        flows = newFlows;
    }
</script>

<div
    class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200"
>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <!-- Header -->
        <header
            class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0"
        >
            <div class="flex-1">
                <h1
                    class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight"
                >
                    Sankey Diagram App
                </h1>
                <p
                    class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2"
                >
                    Real-time Sankey diagram visualization tool
                </p>
            </div>

            {#if themeStore.initialized}
                <!-- Theme Toggle Button -->
                <button
                    onclick={() => themeStore.toggle()}
                    class="self-start sm:self-auto p-2 sm:p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                           transition-colors duration-200 text-gray-700 dark:text-gray-300 shadow-sm"
                    title="Toggle theme"
                    aria-label="Toggle between dark and light theme"
                >
                    {#if themeStore.isDark}
                        <!-- Sun icon for light mode -->
                        <svg
                            class="w-5 h-5 sm:w-6 sm:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                            ></path>
                        </svg>
                    {:else}
                        <!-- Moon icon for dark mode -->
                        <svg
                            class="w-5 h-5 sm:w-6 sm:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                            ></path>
                        </svg>
                    {/if}
                </button>
            {/if}
        </header>

        <!-- Main content -->
        <main class="space-y-4 sm:space-y-6">
            {#if initialized}
                <!-- Data Input Interface -->
                <DataInput {flows} onFlowsChange={handleFlowsChange} />

                <!-- Control Panel -->
                <ControlPanel {flows} onClearAll={handleClearAll} />

                <!-- Performance Dashboard -->
                <PerformanceDashboard {flows} showDetails={flows.length > 20} />

                <!-- Sankey Chart Visualization -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
                >
                    <h3
                        class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4"
                    >
                        Real-time Sankey Diagram
                    </h3>
                    <div class="w-full overflow-hidden">
                        <SankeyChart
                            data={chartData}
                            theme={themeStore.mode}
                            width="100%"
                            height="400px"
                        />
                    </div>
                </div>
            {/if}
        </main>
    </div>
</div>

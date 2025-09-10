<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { FlowData } from '../types';
    import { transformFlowsToSankeyData } from '../transform';
    import { themeStore } from '../stores/theme.svelte';
    import SankeyChart from './SankeyChart.svelte';
    import DataInput from './DataInput.svelte';
    import ControlPanel from './ControlPanel.svelte';
    import PerformanceDashboard from './PerformanceDashboard.svelte';
    import ErrorDisplay from './ErrorDisplay.svelte';
    import { errorHandler, safeExecute } from '../utils/error-handler.js';
    import {
        AccessibilityManager,
        generateChartDescription,
    } from '../utils/accessibility';
    import { performanceOptimizer } from '../utils/performance-optimizer';
    import { animationManager, animations } from '../utils/animations';

    // Global application state using Svelte 5 runes
    let flows = $state([] as FlowData[]);
    let initialized = $state(false);
    let error = $state<string | null>(null);
    let isLoading = $state(false);

    // Accessibility and performance managers
    let accessibilityManager: AccessibilityManager | null = null;
    let appContainer: HTMLElement | undefined = $state();
    let mainContent: HTMLElement | undefined = $state();

    // Performance tracking
    let performanceProfile = $state(
        performanceOptimizer.getPerformanceProfile()
    );

    // Pure derived chart data without side effects
    let chartData = $derived.by(() => {
        try {
            // Validate flows array before transformation
            if (!Array.isArray(flows)) {
                return {
                    nodes: [],
                    links: [],
                    error: 'Flows data must be an array',
                };
            }

            // Handle empty flows gracefully
            if (flows.length === 0) {
                return { nodes: [], links: [], error: null };
            }

            // Validate each flow before transformation
            for (let index = 0; index < flows.length; index++) {
                const flow = flows[index];
                if (!flow || typeof flow !== 'object') {
                    return {
                        nodes: [],
                        links: [],
                        error: `Invalid flow at index ${index}: flow must be an object`,
                    };
                }
                if (!flow.id || typeof flow.id !== 'string') {
                    return {
                        nodes: [],
                        links: [],
                        error: `Invalid flow at index ${index}: missing or invalid id`,
                    };
                }
                if (!flow.source || typeof flow.source !== 'string') {
                    return {
                        nodes: [],
                        links: [],
                        error: `Invalid flow at index ${index}: missing or invalid source`,
                    };
                }
                if (!flow.target || typeof flow.target !== 'string') {
                    return {
                        nodes: [],
                        links: [],
                        error: `Invalid flow at index ${index}: missing or invalid target`,
                    };
                }
                if (
                    typeof flow.value !== 'number' ||
                    isNaN(flow.value) ||
                    flow.value <= 0
                ) {
                    return {
                        nodes: [],
                        links: [],
                        error: `Invalid flow at index ${index}: value must be a positive number`,
                    };
                }
            }

            const result = transformFlowsToSankeyData(flows);

            // Validate transformation result
            if (!result || typeof result !== 'object') {
                return {
                    nodes: [],
                    links: [],
                    error: 'Data transformation returned invalid result',
                };
            }
            if (!Array.isArray(result.nodes) || !Array.isArray(result.links)) {
                return {
                    nodes: [],
                    links: [],
                    error: 'Transformed data must contain nodes and links arrays',
                };
            }

            return { ...result, error: null };
        } catch (err) {
            console.error('Error transforming flow data:', err);
            const errorMessage =
                err instanceof Error ? err.message : String(err);

            // Create detailed error through error handler (no state mutation here)
            errorHandler.createError(
                errorMessage,
                'validation',
                'data_transformation',
                true
            );

            return { nodes: [], links: [], error: errorMessage };
        }
    });

    // Effect to update error state based on chartData changes
    $effect(() => {
        if (chartData.error !== undefined) {
            error = chartData.error;
        }
    });

    // Initialize application with accessibility and performance features
    onMount(async () => {
        try {
            isLoading = true;

            // Initialize theme store
            themeStore.initialize();

            // Initialize accessibility manager
            if (appContainer) {
                accessibilityManager = new AccessibilityManager(appContainer, {
                    enableKeyboardNavigation: true,
                    enableScreenReader: true,
                    enableHighContrast: true,
                    enableReducedMotion: true,
                });

                // Announce app initialization
                accessibilityManager.announce(
                    'Sankey Diagram App loaded successfully'
                );
            }

            // Animate main content in
            if (mainContent) {
                await animations.fadeIn(mainContent, { duration: 500 });
            }

            // Update performance profile periodically
            const performanceInterval = setInterval(() => {
                performanceProfile =
                    performanceOptimizer.getPerformanceProfile();
            }, 2000);

            // Store interval for cleanup
            (globalThis as any).__performanceInterval = performanceInterval;

            initialized = true;
            error = null;
        } catch (err) {
            console.error('Failed to initialize application:', err);
            error =
                'Failed to initialize application. Please refresh the page.';

            if (accessibilityManager) {
                accessibilityManager.announceError(
                    'Application failed to initialize'
                );
            }
        } finally {
            isLoading = false;
        }
    });

    // Cleanup on destroy
    onDestroy(() => {
        accessibilityManager?.destroy();
        performanceOptimizer.destroy();
        animationManager?.cancelAllAnimations();

        // Clear performance monitoring interval
        if ((globalThis as any).__performanceInterval) {
            clearInterval((globalThis as any).__performanceInterval);
        }
    });

    // Error boundary for flow operations with enhanced error handling
    async function handleFlowsChange(newFlows: FlowData[]) {
        const result = await safeExecute(() => {
            // Validate new flows before updating
            if (!Array.isArray(newFlows)) {
                throw new Error('New flows must be an array');
            }

            // Validate each flow
            newFlows.forEach((flow, index) => {
                if (!flow || typeof flow !== 'object') {
                    throw new Error(`Invalid flow at index ${index}`);
                }
                if (
                    !flow.id ||
                    !flow.source ||
                    !flow.target ||
                    typeof flow.value !== 'number'
                ) {
                    throw new Error(`Incomplete flow data at index ${index}`);
                }
            });

            flows = newFlows;
            error = null;

            // Announce chart update to screen readers
            if (accessibilityManager) {
                const uniqueNodes = new Set<string>();
                newFlows.forEach(flow => {
                    uniqueNodes.add(flow.source);
                    uniqueNodes.add(flow.target);
                });
                accessibilityManager.announceChartUpdate(
                    uniqueNodes.size,
                    newFlows.length
                );
            }

            return true;
        }, 'flow_update');

        if (!result) {
            const errorMessage = 'Failed to update flows';
            errorHandler.createError(
                errorMessage,
                'runtime',
                'flow_update',
                true
            );
            error = errorMessage;

            if (accessibilityManager) {
                accessibilityManager.announceError(errorMessage);
            }
        }
    }

    // Error boundary for clear all operation
    async function handleClearAll() {
        const result = await safeExecute(() => {
            flows = [];
            error = null;

            // Announce clear action to screen readers
            if (accessibilityManager) {
                accessibilityManager.announce(
                    'All data flows have been cleared'
                );
            }

            return true;
        }, 'clear_flows');

        if (!result) {
            const errorMessage = 'Failed to clear flows';
            errorHandler.createError(
                errorMessage,
                'runtime',
                'clear_flows',
                true
            );
            error = errorMessage;

            if (accessibilityManager) {
                accessibilityManager.announceError(errorMessage);
            }
        }
    }

    // Error boundary for theme operations
    async function handleThemeToggle() {
        const result = await safeExecute(() => {
            if (!themeStore || typeof themeStore.toggle !== 'function') {
                throw new Error('Theme store not properly initialized');
            }

            const oldTheme = themeStore.mode;
            themeStore.toggle();
            const newTheme = themeStore.mode;

            // Announce theme change to screen readers
            if (accessibilityManager) {
                accessibilityManager.announce(
                    `Theme changed to ${newTheme} mode`
                );
            }

            error = null;
            return true;
        }, 'theme_toggle');

        if (!result) {
            const errorMessage = 'Failed to change theme';
            errorHandler.createError(
                errorMessage,
                'runtime',
                'theme_toggle',
                true
            );
            error = errorMessage;

            if (accessibilityManager) {
                accessibilityManager.announceError(errorMessage);
            }
        }
    }

    // Clear error after a timeout
    $effect(() => {
        if (error) {
            const timeoutId = setTimeout(() => {
                error = null;
            }, 5000); // Clear error after 5 seconds

            return () => clearTimeout(timeoutId);
        }
    });
</script>

<div
    bind:this={appContainer}
    class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200"
    role="application"
    aria-label="Sankey Diagram Application"
>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <!-- Loading State -->
        {#if isLoading}
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400 mx-auto mb-4"
                    ></div>
                    <p class="text-gray-600 dark:text-gray-400">
                        Loading application...
                    </p>
                </div>
            </div>
        {:else if !initialized}
            <!-- Initialization Error -->
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <div class="text-red-500 mb-4">
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
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            ></path>
                        </svg>
                    </div>
                    <h2
                        class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
                    >
                        Failed to Initialize
                    </h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        The application failed to start properly.
                    </p>
                    <button
                        onclick={() => window.location.reload()}
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        {:else}
            <!-- Enhanced Error Display -->
            <ErrorDisplay />

            <!-- Legacy Error Banner (fallback) -->
            {#if error}
                <div class="mb-6 alert alert-error bg-white dark:bg-gray-800">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-5 w-5 text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3 flex-1">
                            <p
                                class="text-sm font-medium text-red-800 dark:text-red-200"
                            >
                                {error}
                            </p>
                        </div>
                        <div class="ml-3">
                            <button
                                onclick={() => (error = null)}
                                class="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                aria-label="Close error message"
                            >
                                <svg
                                    class="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Header -->
            <header
                class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-3"
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
                        onclick={handleThemeToggle}
                        class="self-start sm:self-auto icon-btn"
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
            <main
                bind:this={mainContent}
                class="space-y-5 sm:space-y-7 animate-fade-in"
                aria-label="Main application content"
                tabindex="-1"
            >
                <!-- Screen reader description -->
                <div class="sr-only" aria-live="polite">
                    {generateChartDescription(
                        chartData.nodes.length,
                        flows.length,
                        flows
                    )}
                </div>
                <!-- Data Input Interface -->
                <DataInput {flows} onFlowsChange={handleFlowsChange} />

                <!-- Control Panel -->
                <ControlPanel {flows} onClearAll={handleClearAll} />

                <!-- Performance Dashboard -->
                <PerformanceDashboard {flows} showDetails={flows.length > 20} />

                <!-- Sankey Chart Visualization -->
                <section
                    class="card chart-container"
                    role="img"
                    aria-label="Sankey diagram visualization"
                    aria-describedby="chart-description"
                >
                    <div class="flex justify-between items-center mb-3 sm:mb-4">
                        <h3
                            class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
                        >
                            Real-time Sankey Diagram
                        </h3>

                        <!-- Performance indicator -->
                        <div class="flex items-center gap-2">
                            <div class="pill-neutral">
                                <span
                                    class="pill-dot {performanceProfile.isOptimal
                                        ? 'bg-teal-500'
                                        : 'bg-amber-500'}"
                                ></span>
                                <span class="text-xs">
                                    {performanceProfile.isOptimal
                                        ? 'Optimal'
                                        : 'Optimizing'}
                                </span>
                            </div>

                            <!-- Accessibility toggle -->
                            <button
                                onclick={() =>
                                    accessibilityManager?.toggleHighContrast()}
                                class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                title="Toggle high contrast mode"
                                aria-label="Toggle high contrast mode"
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
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Chart description for screen readers -->
                    <div id="chart-description" class="sr-only">
                        {generateChartDescription(
                            chartData.nodes.length,
                            flows.length,
                            flows
                        )}
                    </div>

                    <div class="w-full overflow-hidden">
                        <SankeyChart
                            data={{
                                nodes: chartData.nodes,
                                links: chartData.links,
                            }}
                            theme={themeStore.mode}
                            width="100%"
                            height="400px"
                        />
                    </div>

                    <!-- Chart data summary for accessibility -->
                    {#if flows.length > 0}
                        <div
                            class="mt-4 text-sm text-gray-600 dark:text-gray-400"
                        >
                            <p>
                                Chart contains {chartData.nodes.length} nodes and
                                {flows.length} connections.
                                {#if flows.length > 0}
                                    Total flow value: {flows
                                        .reduce(
                                            (sum, flow) => sum + flow.value,
                                            0
                                        )
                                        .toFixed(2)}.
                                {/if}
                            </p>
                        </div>
                    {/if}
                </section>
            </main>
        {/if}
    </div>
</div>

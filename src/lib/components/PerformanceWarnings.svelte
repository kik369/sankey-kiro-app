<script lang="ts">
    import type { FlowData } from '../types.js';
    import {
        analyzePerformance,
        estimateMemoryUsage,
        getOptimizationSuggestions,
        type PerformanceWarning,
    } from '../utils/performance-limits.js';

    // Props
    let {
        flows,
        showDetails = false,
    }: {
        flows: FlowData[];
        showDetails?: boolean;
    } = $props();

    // Derived performance data
    let warnings = $derived(analyzePerformance(flows));
    let memoryUsage = $derived(estimateMemoryUsage(flows));
    let suggestions = $derived(getOptimizationSuggestions(flows));

    // Filter warnings by level
    let errorWarnings = $derived(warnings.filter(w => w.level === 'error'));
    let warningMessages = $derived(warnings.filter(w => w.level === 'warning'));

    // Show expanded details state
    let showExpandedDetails = $state(false);
</script>

{#if warnings.length > 0}
    <div class="space-y-3">
        <!-- Error warnings (blocking) -->
        {#if errorWarnings.length > 0}
            <div
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
                <div class="flex items-start">
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
                        <h4
                            class="text-sm font-medium text-red-800 dark:text-red-200"
                        >
                            Performance Limit Exceeded
                        </h4>
                        <div
                            class="mt-2 text-sm text-red-700 dark:text-red-300"
                        >
                            {#each errorWarnings as warning}
                                <p class="mb-1">{warning.message}</p>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Warning messages -->
        {#if warningMessages.length > 0}
            <div
                class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
            >
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg
                            class="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                    <div class="ml-3 flex-1">
                        <h4
                            class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                        >
                            Performance Warning
                        </h4>
                        <div
                            class="mt-2 text-sm text-yellow-700 dark:text-yellow-300"
                        >
                            {#each warningMessages as warning}
                                <p class="mb-1">{warning.message}</p>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Performance details (expandable) -->
        {#if showDetails && (warnings.length > 0 || memoryUsage.level !== 'low')}
            <div
                class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
                <button
                    onclick={() => (showExpandedDetails = !showExpandedDetails)}
                    class="flex items-center justify-between w-full text-left"
                >
                    <h4
                        class="text-sm font-medium text-blue-800 dark:text-blue-200"
                    >
                        Performance Details
                    </h4>
                    <svg
                        class="h-4 w-4 text-blue-600 dark:text-blue-400 transform transition-transform duration-200 {showExpandedDetails
                            ? 'rotate-180'
                            : ''}"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {#if showExpandedDetails}
                    <div
                        class="mt-3 space-y-3 text-sm text-blue-700 dark:text-blue-300"
                    >
                        <!-- Memory usage -->
                        <div class="flex justify-between items-center">
                            <span>Estimated Memory Usage:</span>
                            <span
                                class="font-medium {memoryUsage.level === 'high'
                                    ? 'text-red-600 dark:text-red-400'
                                    : memoryUsage.level === 'medium'
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-green-600 dark:text-green-400'}"
                            >
                                {memoryUsage.estimatedMB.toFixed(1)} MB ({memoryUsage.level})
                            </span>
                        </div>

                        <!-- Current limits -->
                        <div
                            class="grid grid-cols-2 gap-4 pt-2 border-t border-blue-200 dark:border-blue-700"
                        >
                            <div>
                                <div class="font-medium">Nodes</div>
                                <div class="text-xs">
                                    {warnings.find(w => w.type === 'nodes')
                                        ?.current || 0} / 50 max
                                </div>
                            </div>
                            <div>
                                <div class="font-medium">Connections</div>
                                <div class="text-xs">
                                    {flows.length} / 100 max
                                </div>
                            </div>
                        </div>

                        <!-- Optimization suggestions -->
                        {#if suggestions.length > 0}
                            <div
                                class="pt-2 border-t border-blue-200 dark:border-blue-700"
                            >
                                <div class="font-medium mb-2">
                                    Optimization Suggestions:
                                </div>
                                <ul
                                    class="list-disc list-inside space-y-1 text-xs"
                                >
                                    {#each suggestions as suggestion}
                                        <li>{suggestion}</li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

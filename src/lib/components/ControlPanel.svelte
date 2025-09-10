<script lang="ts">
    import type { FlowData } from '../types.js';

    // Props
    interface Props {
        flows: FlowData[];
        onClearAll: () => void;
    }

    let { flows, onClearAll } = $props();

    // State for confirmation dialog
    let showConfirmDialog = $state(false);

    function handleClearAll() {
        showConfirmDialog = true;
    }

    function confirmClear() {
        onClearAll();
        showConfirmDialog = false;
    }

    function cancelClear() {
        showConfirmDialog = false;
    }

    // Calculate statistics
    let stats = $derived(() => {
        const uniqueNodes = new Set<string>();
        flows.forEach((flow: FlowData) => {
            uniqueNodes.add(flow.source);
            uniqueNodes.add(flow.target);
        });

        const totalValue = flows.reduce(
            (sum: number, flow: FlowData) => sum + flow.value,
            0
        );

        return {
            totalFlows: flows.length,
            uniqueNodes: uniqueNodes.size,
            totalValue: totalValue.toFixed(2),
        };
    });
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
>
    <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
    >
        <!-- Statistics -->
        <div class="flex-1">
            <h3
                class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4"
            >
                Diagram Statistics
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div
                    class="text-center sm:text-left p-3 sm:p-0 rounded-lg sm:rounded-none"
                >
                    <div
                        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100"
                    >
                        {stats().totalFlows}
                    </div>
                    <div
                        class="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                    >
                        Total Flows
                    </div>
                </div>
                <div
                    class="text-center sm:text-left p-3 sm:p-0 rounded-lg sm:rounded-none"
                >
                    <div
                        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100"
                    >
                        {stats().uniqueNodes}
                    </div>
                    <div
                        class="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                    >
                        Unique Nodes
                    </div>
                </div>
                <div
                    class="text-center sm:text-left p-3 sm:p-0 rounded-lg sm:rounded-none"
                >
                    <div
                        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100"
                    >
                        {stats().totalValue}
                    </div>
                    <div
                        class="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                    >
                        Total Value
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 lg:ml-6">
            <button
                onclick={handleClearAll}
                disabled={flows.length === 0}
                class="w-full sm:w-auto btn btn-danger disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-sm"
            >
                Clear All Data
            </button>
        </div>
    </div>

    <!-- Performance Warnings -->
    {#if stats().uniqueNodes > 40 || stats().totalFlows > 80}
        <div class="mt-4 alert alert-warning">
            <div class="flex">
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
                <div class="ml-3">
                    <h4
                        class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                    >
                        Performance Warning
                    </h4>
                    <div
                        class="mt-2 text-sm text-yellow-700 dark:text-yellow-300"
                    >
                        {#if stats().uniqueNodes > 40}
                            <p>
                                You have {stats().uniqueNodes} nodes. Performance
                                may be affected with more than 50 nodes.
                            </p>
                        {/if}
                        {#if stats().totalFlows > 80}
                            <p>
                                You have {stats().totalFlows} flows. Performance
                                may be affected with more than 100 flows.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Confirmation Dialog -->
{#if showConfirmDialog}
    <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6"
        >
            <div class="flex items-center mb-4">
                <div class="flex-shrink-0">
                    <svg
                        class="h-6 w-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h3
                    class="ml-3 text-lg font-medium text-gray-900 dark:text-white"
                >
                    Confirm Clear All Data
                </h3>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to clear all {stats().totalFlows} flows? This
                action cannot be undone.
            </p>

            <div
                class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3"
            >
                <button
                    onclick={cancelClear}
                    class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium text-base sm:text-sm
                 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                 transition-colors duration-200"
                >
                    Cancel
                </button>
                <button
                    onclick={confirmClear}
                    class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md text-base sm:text-sm
                 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                 transition-colors duration-200"
                >
                    Clear All
                </button>
            </div>
        </div>
    </div>
{/if}

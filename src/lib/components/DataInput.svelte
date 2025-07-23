<script lang="ts">
    import type { FlowInput, FlowData, ValidationResult } from '$lib/types.js';
    import { validateFlowInput, createFlowData } from '$lib/validation.js';
    import {
        canAddFlow,
        analyzePerformance,
        PERFORMANCE_LIMITS,
    } from '$lib/utils/performance-limits.js';
    import { debounce } from '$lib/utils/debounce.js';
    import PerformanceWarnings from './PerformanceWarnings.svelte';
    import { errorHandler, safeExecute } from '$lib/utils/error-handler.js';

    // Props
    let {
        flows,
        onFlowsChange,
    }: {
        flows: FlowData[];
        onFlowsChange: (flows: FlowData[]) => void;
    } = $props();

    // Local state for new flow input
    let newFlow = $state({
        source: '',
        target: '',
        value: '',
    } as FlowInput);

    // Validation state
    let validationResult = $state({
        isValid: true,
        errors: [],
    } as ValidationResult);
    let showValidation = $state(false);

    // Performance state
    let performanceWarnings = $derived(analyzePerformance(flows));
    let hasPerformanceErrors = $derived(
        performanceWarnings.some(w => w.level === 'error')
    );

    // Debounced validation function
    const debouncedValidation = debounce((input: FlowInput) => {
        if (input.source || input.target || input.value) {
            validationResult = validateFlowInput(input);
            showValidation = !validationResult.isValid;
        } else {
            showValidation = false;
        }
    }, PERFORMANCE_LIMITS.DEBOUNCE_DELAY);

    // Real-time validation effect with debouncing
    $effect(() => {
        debouncedValidation(newFlow);
    });

    async function addFlow() {
        const result = await safeExecute(() => {
            // Comprehensive input validation
            const validation = validateFlowInput(newFlow);
            if (!validation.isValid) {
                validationResult = validation;
                showValidation = true;

                // Log validation errors for debugging
                if (import.meta.env.DEV) {
                    console.warn('Flow validation failed:', validation.errors);
                }

                // Create user-friendly error through error handler
                errorHandler.handleValidationError(
                    'flow_input',
                    newFlow,
                    validation.errors
                );

                return false;
            }

            // Check performance limits before adding
            const performanceCheck = canAddFlow(flows, {
                source: newFlow.source,
                target: newFlow.target,
            });

            if (!performanceCheck.canAdd) {
                // Show performance errors in validation
                validationResult = {
                    isValid: false,
                    errors: performanceCheck.warnings.map(w => w.message),
                };
                showValidation = true;

                // Create performance warning through error handler
                performanceCheck.warnings.forEach(warning => {
                    if (warning.level === 'error') {
                        errorHandler.handlePerformanceWarning(
                            warning.type,
                            warning.current,
                            warning.limit
                        );
                    }
                });

                return false;
            }

            // Attempt to create flow data with error handling
            let flowData;
            try {
                flowData = createFlowData(newFlow);
            } catch (createError) {
                const errorMessage =
                    createError instanceof Error
                        ? createError.message
                        : 'Unknown error';
                validationResult = {
                    isValid: false,
                    errors: [errorMessage],
                };
                showValidation = true;

                // Log creation error
                errorHandler.createError(
                    `Flow creation failed: ${errorMessage}`,
                    'error',
                    'flow_creation',
                    true
                );

                return false;
            }

            // Check for duplicate flows and warn user
            const duplicateCheck = flows.find(
                flow =>
                    flow.source.toLowerCase() ===
                        newFlow.source.toLowerCase() &&
                    flow.target.toLowerCase() === newFlow.target.toLowerCase()
            );

            if (duplicateCheck) {
                validationResult = {
                    isValid: true,
                    errors: [],
                    warnings: [
                        `A flow from "${newFlow.source}" to "${newFlow.target}" already exists. This will create a duplicate.`,
                    ],
                };
                showValidation = true;
                // Continue with creation but show warning
            }

            // Update flows with comprehensive error handling
            try {
                const updatedFlows = [...flows, flowData];
                flows = updatedFlows;
                onFlowsChange(updatedFlows);

                // Reset form and validation state
                newFlow = { source: '', target: '', value: '' };
                showValidation = false;
                validationResult = { isValid: true, errors: [] };

                return true;
            } catch (updateError) {
                const errorMessage =
                    updateError instanceof Error
                        ? updateError.message
                        : 'Unknown error';
                validationResult = {
                    isValid: false,
                    errors: [`Failed to update flows: ${errorMessage}`],
                };
                showValidation = true;

                errorHandler.createError(
                    `Flow update failed: ${errorMessage}`,
                    'error',
                    'flow_update',
                    true
                );

                return false;
            }
        }, 'data_input');

        if (!result) {
            // Enhanced error handling for failed operations
            if (!showValidation) {
                // Only show generic error if no specific validation error was set
                validationResult = {
                    isValid: false,
                    errors: [
                        'Failed to add flow. Please check your input and try again.',
                    ],
                };
                showValidation = true;
            }

            // Create comprehensive error report
            errorHandler.createError(
                'Flow addition operation failed',
                'error',
                'data_input',
                true
            );
        }
    }

    // Debounced flow removal with error handling
    const debouncedRemoveFlow = debounce(async (flowId: string) => {
        await safeExecute(() => {
            const updatedFlows = flows.filter(flow => flow.id !== flowId);
            flows = updatedFlows;
            onFlowsChange(updatedFlows);
            return true;
        }, 'flow_removal');
    }, 50);

    function removeFlow(flowId: string) {
        debouncedRemoveFlow(flowId);
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && validationResult.isValid) {
            addFlow();
        }
    }
</script>

<div class="space-y-6">
    <!-- Performance Warnings -->
    <PerformanceWarnings {flows} showDetails={true} />

    <!-- Add New Flow Section -->
    <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
    >
        <h3
            class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4"
        >
            Add New Flow
        </h3>

        <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
            <!-- Source Input -->
            <div class="space-y-2">
                <label
                    for="source"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Source
                </label>
                <input
                    id="source"
                    type="text"
                    bind:value={newFlow.source}
                    onkeypress={handleKeyPress}
                    placeholder="Enter source node"
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
                 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                />
            </div>

            <!-- Target Input -->
            <div class="space-y-2">
                <label
                    for="target"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Target
                </label>
                <input
                    id="target"
                    type="text"
                    bind:value={newFlow.target}
                    onkeypress={handleKeyPress}
                    placeholder="Enter target node"
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
                 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                />
            </div>

            <!-- Value Input -->
            <div class="space-y-2">
                <label
                    for="value"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Value
                </label>
                <input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    bind:value={newFlow.value}
                    onkeypress={handleKeyPress}
                    placeholder="Enter value"
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
                 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                />
            </div>

            <!-- Add Button -->
            <div class="space-y-2 sm:col-span-2 lg:col-span-1">
                <label
                    for="add-flow-btn"
                    class="hidden lg:block text-sm font-medium text-transparent"
                    >Action</label
                >
                <button
                    id="add-flow-btn"
                    onclick={addFlow}
                    disabled={!validationResult.isValid ||
                        (!newFlow.source &&
                            !newFlow.target &&
                            !newFlow.value) ||
                        hasPerformanceErrors}
                    class="w-full px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                 disabled:cursor-not-allowed text-white font-medium rounded-md shadow-sm text-base sm:text-sm
                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                 transition-colors duration-200"
                >
                    {hasPerformanceErrors ? 'Limit Reached' : 'Add Flow'}
                </button>
            </div>
        </div>

        <!-- Enhanced Validation Display -->
        {#if showValidation && (validationResult.errors.length > 0 || (validationResult.warnings && validationResult.warnings.length > 0))}
            <div class="mt-4 space-y-3">
                <!-- Validation Errors -->
                {#if validationResult.errors.length > 0}
                    <div
                        class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
                    >
                        <div class="flex">
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
                                    Please fix the following errors:
                                </h4>
                                <ul
                                    class="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1"
                                >
                                    {#each validationResult.errors as error}
                                        <li class="flex items-start">
                                            <span
                                                class="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0"
                                            ></span>
                                            <span>{error}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Validation Warnings -->
                {#if validationResult.warnings && validationResult.warnings.length > 0}
                    <div
                        class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
                    >
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
                            <div class="ml-3 flex-1">
                                <h4
                                    class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                                >
                                    Suggestions for improvement:
                                </h4>
                                <ul
                                    class="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1"
                                >
                                    {#each validationResult.warnings as warning}
                                        <li class="flex items-start">
                                            <span
                                                class="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0"
                                            ></span>
                                            <span>{warning}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Current Flows List -->
    {#if flows.length > 0}
        <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
            <h3
                class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4"
            >
                Current Flows ({flows.length})
            </h3>

            <div class="space-y-3">
                {#each flows as flow (flow.id)}
                    <div
                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 space-y-3 sm:space-y-0"
                    >
                        <div
                            class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4"
                        >
                            <div class="text-sm">
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-300"
                                    >Source:</span
                                >
                                <span
                                    class="ml-2 text-gray-900 dark:text-white break-words"
                                    >{flow.source}</span
                                >
                            </div>
                            <div class="text-sm">
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-300"
                                    >Target:</span
                                >
                                <span
                                    class="ml-2 text-gray-900 dark:text-white break-words"
                                    >{flow.target}</span
                                >
                            </div>
                            <div class="text-sm">
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-300"
                                    >Value:</span
                                >
                                <span class="ml-2 text-gray-900 dark:text-white"
                                    >{flow.value}</span
                                >
                            </div>
                        </div>

                        <button
                            onclick={() => removeFlow(flow.id)}
                            class="self-start sm:self-auto sm:ml-4 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300
                     hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 flex items-center space-x-2"
                            title="Remove flow"
                            aria-label="Remove flow from {flow.source} to {flow.target}"
                        >
                            <svg
                                class="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            <span class="text-sm sm:hidden">Remove</span>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <div
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600"
        >
            <svg
                class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No flows yet
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding your first data flow above.
            </p>
        </div>
    {/if}
</div>

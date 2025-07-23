<script lang="ts">
    import type { AppError, ErrorSeverity } from '$lib/types';
    import { errorHandler } from '$lib/utils/error-handler';
    import { onMount, onDestroy } from 'svelte';

    // Props
    let {
        errors = [],
        showDetails = false,
        autoHide = true,
        autoHideDelay = 5000,
        maxErrors = 5,
        position = 'top',
    }: {
        errors?: AppError[];
        showDetails?: boolean;
        autoHide?: boolean;
        autoHideDelay?: number;
        maxErrors?: number;
        position?: 'top' | 'bottom' | 'inline';
    } = $props();

    // Local state
    let displayedErrors = $state<AppError[]>([]);
    let unsubscribe: (() => void) | null = null;

    // Auto-hide timers
    let hideTimers = new Map<string, number>();

    // Initialize error subscription
    onMount(() => {
        // Subscribe to new errors
        unsubscribe = errorHandler.onError(error => {
            addError(error);
        });

        // Load existing errors
        displayedErrors = [...errorHandler.getAllErrors().slice(-maxErrors)];
    });

    onDestroy(() => {
        // Clean up subscription
        if (unsubscribe) {
            unsubscribe();
        }

        // Clear all timers
        hideTimers.forEach(timerId => clearTimeout(timerId));
        hideTimers.clear();
    });

    function addError(error: AppError) {
        // Add to displayed errors
        displayedErrors = [...displayedErrors, error].slice(-maxErrors);

        // Set up auto-hide if enabled
        if (autoHide && error.severity !== 'error') {
            const timerId = setTimeout(() => {
                removeError(error.id);
            }, autoHideDelay);

            hideTimers.set(error.id, timerId);
        }
    }

    function removeError(errorId: string) {
        displayedErrors = displayedErrors.filter(error => error.id !== errorId);
        errorHandler.clearError(errorId);

        // Clear timer if exists
        const timerId = hideTimers.get(errorId);
        if (timerId) {
            clearTimeout(timerId);
            hideTimers.delete(errorId);
        }
    }

    function clearAllErrors() {
        displayedErrors = [];
        errorHandler.clearAllErrors();

        // Clear all timers
        hideTimers.forEach(timerId => clearTimeout(timerId));
        hideTimers.clear();
    }

    function getErrorIcon(severity: ErrorSeverity): string {
        switch (severity) {
            case 'error':
                return 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z';
            case 'warning':
                return 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z';
            case 'info':
                return 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z';
            default:
                return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    }

    function getErrorStyles(severity: ErrorSeverity): string {
        const baseStyles =
            'border rounded-md p-4 mb-3 transition-all duration-300 ease-in-out';

        switch (severity) {
            case 'error':
                return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800`;
            case 'info':
                return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`;
            default:
                return `${baseStyles} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`;
        }
    }

    function getIconColor(severity: ErrorSeverity): string {
        switch (severity) {
            case 'error':
                return 'text-red-400';
            case 'warning':
                return 'text-yellow-400';
            case 'info':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
        }
    }

    function getTextColor(severity: ErrorSeverity): string {
        switch (severity) {
            case 'error':
                return 'text-red-800 dark:text-red-200';
            case 'warning':
                return 'text-yellow-800 dark:text-yellow-200';
            case 'info':
                return 'text-blue-800 dark:text-blue-200';
            default:
                return 'text-gray-800 dark:text-gray-200';
        }
    }

    function formatTimestamp(timestamp: Date): string {
        return timestamp.toLocaleTimeString();
    }

    // Reactive updates for external errors prop
    $effect(() => {
        if (errors.length > 0) {
            displayedErrors = [...errors];
        }
    });
</script>

{#if displayedErrors.length > 0}
    <div
        class="error-display-container"
        class:fixed={position !== 'inline'}
        class:top-4={position === 'top'}
        class:bottom-4={position === 'bottom'}
        class:left-4={position !== 'inline'}
        class:right-4={position !== 'inline'}
        class:z-50={position !== 'inline'}
        class:max-w-md={position !== 'inline'}
        class:w-full={position === 'inline'}
    >
        <!-- Clear all button for multiple errors -->
        {#if displayedErrors.length > 1}
            <div class="flex justify-end mb-2">
                <button
                    onclick={clearAllErrors}
                    class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                           underline transition-colors duration-200"
                >
                    Clear all ({displayedErrors.length})
                </button>
            </div>
        {/if}

        <!-- Error messages -->
        {#each displayedErrors as error (error.id)}
            <div class={getErrorStyles(error.severity)}>
                <div class="flex items-start">
                    <!-- Error icon -->
                    <div class="flex-shrink-0">
                        <svg
                            class="h-5 w-5 {getIconColor(error.severity)}"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d={getErrorIcon(error.severity)}
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>

                    <!-- Error content -->
                    <div class="ml-3 flex-1">
                        <!-- Main error message -->
                        <div
                            class="text-sm font-medium {getTextColor(
                                error.severity
                            )}"
                        >
                            {error.userMessage}
                        </div>

                        <!-- Additional details -->
                        {#if showDetails}
                            <div
                                class="mt-2 text-xs {getTextColor(
                                    error.severity
                                )} opacity-75"
                            >
                                <div>Context: {error.context || 'General'}</div>
                                <div>
                                    Time: {formatTimestamp(error.timestamp)}
                                </div>
                                {#if error.recoverable}
                                    <div
                                        class="text-green-600 dark:text-green-400"
                                    >
                                        ✓ Recoverable
                                    </div>
                                {:else}
                                    <div class="text-red-600 dark:text-red-400">
                                        ⚠ Critical
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <!-- Technical details (only in development) -->
                        {#if showDetails && import.meta.env.DEV}
                            <details class="mt-2">
                                <summary
                                    class="text-xs cursor-pointer {getTextColor(
                                        error.severity
                                    )} opacity-50"
                                >
                                    Technical Details
                                </summary>
                                <pre
                                    class="mt-1 text-xs {getTextColor(
                                        error.severity
                                    )} opacity-50 whitespace-pre-wrap">
{error.message}
                                </pre>
                            </details>
                        {/if}
                    </div>

                    <!-- Close button -->
                    <div class="ml-3 flex-shrink-0">
                        <button
                            onclick={() => removeError(error.id)}
                            class="{getIconColor(
                                error.severity
                            )} hover:opacity-75 transition-opacity duration-200"
                            aria-label="Close error message"
                        >
                            <svg
                                class="h-4 w-4"
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
        {/each}
    </div>
{/if}

<style>
    .error-display-container {
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

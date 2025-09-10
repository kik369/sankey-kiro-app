<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        errorHandler,
        safeExecute,
        type AppError,
    } from '../utils/error-handler';

    // Props
    let {
        children,
        fallback = null,
        onError = null,
        context = 'component',
        showErrorDetails = false,
    }: {
        children: any;
        fallback?: any;
        onError?: ((error: AppError) => void) | null;
        context?: string;
        showErrorDetails?: boolean;
    } = $props();

    // State
    let hasError = $state(false);
    let error = $state<AppError | null>(null);
    let unsubscribe: (() => void) | null = null;

    onMount(() => {
        // Subscribe to errors in this context
        unsubscribe = errorHandler.subscribe(errors => {
            const latestError = errors[errors.length - 1];
            if (
                latestError &&
                (latestError.context === context || !latestError.context)
            ) {
                hasError = true;
                error = latestError;
                if (onError) {
                    onError(latestError);
                }
            }
        });

        // Set up global error handler for unhandled errors
        const handleGlobalError = (event: ErrorEvent) => {
            const appError = errorHandler.createError(
                event.message || 'Unknown error occurred',
                'runtime',
                context,
                true
            );

            hasError = true;
            error = appError;

            if (onError) {
                onError(appError);
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const appError = errorHandler.createError(
                event.reason?.message || 'Unhandled promise rejection',
                'runtime',
                context,
                true
            );

            hasError = true;
            error = appError;

            if (onError) {
                onError(appError);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('error', handleGlobalError);
            window.addEventListener(
                'unhandledrejection',
                handleUnhandledRejection
            );
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('error', handleGlobalError);
                window.removeEventListener(
                    'unhandledrejection',
                    handleUnhandledRejection
                );
            }
        };
    });

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    function retry() {
        if (error) {
            errorHandler.clearErrors();
        }

        hasError = false;
        error = null;
    }

    function reportError() {
        if (error) {
            console.error('Error Boundary Report:', {
                error: error.message,
                context: error.context,
                timestamp: error.timestamp,
                userMessage: error.userUserMessage,
            });
        }
    }
</script>

{#if hasError && error}
    {#if fallback}
        {@render fallback(error, retry)}
    {:else}
        <div
            class="error-boundary p-6 alert alert-error bg-white dark:bg-gray-800 rounded-lg"
        >
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <svg
                        class="h-6 w-6 text-red-400"
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
                <div class="ml-3 flex-1">
                    <h3
                        class="text-lg font-medium text-gray-900 dark:text-gray-100"
                    >
                        Something went wrong
                    </h3>
                    <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {error.userMessage}
                    </p>

                    {#if showErrorDetails && import.meta.env.DEV}
                        <details class="mt-3">
                            <summary
                                class="text-sm text-red-600 dark:text-red-400 cursor-pointer"
                            >
                                Technical Details
                            </summary>
                            <div
                                class="mt-2 p-3 rounded text-xs bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                                <div>
                                    <strong>Error:</strong>
                                    {error.message}
                                </div>
                                <div>
                                    <strong>Context:</strong>
                                    {error.context || 'Unknown'}
                                </div>
                                <div>
                                    <strong>Time:</strong>
                                    {error.timestamp.toLocaleString()}
                                </div>
                                <div>
                                    <strong>Recoverable:</strong>
                                    {error.recoverable ? 'Yes' : 'No'}
                                </div>
                            </div>
                        </details>
                    {/if}

                    <div class="mt-4 flex space-x-3">
                        {#if error.recoverable}
                            <button
                                onclick={retry}
                                class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                            >
                                Try Again
                            </button>
                        {/if}

                        <button
                            onclick={() => window.location.reload()}
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                        >
                            Reload Page
                        </button>

                        {#if import.meta.env.DEV}
                            <button
                                onclick={reportError}
                                class="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/40 text-sm font-medium rounded-md transition-colors duration-200"
                            >
                                Report Error
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}
{:else}
    {@render children()}
{/if}

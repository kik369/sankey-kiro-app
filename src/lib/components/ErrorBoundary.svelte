<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { errorHandler, safeExecute } from '$lib/utils/error-handler';
    import type { AppError } from '$lib/types';

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
        unsubscribe = errorHandler.onError(appError => {
            if (appError.context === context || !appError.context) {
                hasError = true;
                error = appError;

                if (onError) {
                    onError(appError);
                }
            }
        });

        // Set up global error handler for unhandled errors
        const handleGlobalError = (event: ErrorEvent) => {
            const appError = errorHandler.createError(
                event.message || 'Unknown error occurred',
                'error',
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
                'error',
                context,
                true
            );

            hasError = true;
            error = appError;

            if (onError) {
                onError(appError);
            }
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener(
                'unhandledrejection',
                handleUnhandledRejection
            );
        };
    });

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    function retry() {
        if (error) {
            errorHandler.clearError(error.id);
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
                recoverable: error.recoverable,
                userMessage: error.userMessage,
            });
        }
    }
</script>

{#if hasError && error}
    {#if fallback}
        {@render fallback(error, retry)}
    {:else}
        <div
            class="error-boundary p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
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
                        class="text-lg font-medium text-red-800 dark:text-red-200"
                    >
                        Something went wrong
                    </h3>
                    <p class="mt-2 text-sm text-red-700 dark:text-red-300">
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
                                class="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200"
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
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
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
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
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

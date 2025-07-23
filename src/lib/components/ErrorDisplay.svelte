<script lang="ts">
    import { errorHandler, type AppError } from '$lib/utils/error-handler';
    import { fly } from 'svelte/transition';

    let errors = $state<AppError[]>([]);

    // Subscribe to the error handler store
    $effect(() => {
        const unsubscribe = errorHandler.subscribe((errorList: AppError[]) => {
            errors = errorList.filter((e: AppError) => e.isUserFacing);
        });
        return unsubscribe;
    });

    function dismiss(errorId: string) {
        errorHandler.dismissError(errorId);
    }
</script>

{#if errors.length > 0}
    <div class="fixed bottom-4 right-4 w-full max-w-sm space-y-4 z-50">
        {#each errors as error (error.id)}
            <div
                in:fly={{ y: 20, duration: 300 }}
                out:fly={{ y: 20, duration: 200 }}
                class="p-4 rounded-lg shadow-lg border flex items-start space-x-3 text-sm font-medium transition-all"
                role="alert"
                aria-live="assertive"
                class:bg-red-50={error.type === 'runtime' ||
                    error.type === 'generic'}
                class:dark:bg-red-900={error.type === 'runtime' ||
                    error.type === 'generic'}
                class:border-red-200={error.type === 'runtime' ||
                    error.type === 'generic'}
                class:dark:border-red-700={error.type === 'runtime' ||
                    error.type === 'generic'}
                class:text-red-800={error.type === 'runtime' ||
                    error.type === 'generic'}
                class:dark:text-red-200={error.type === 'runtime' ||
                    error.type === 'generic'}
                class:bg-yellow-50={error.type === 'validation' ||
                    error.type === 'performance'}
                class:dark:bg-yellow-900={error.type === 'validation' ||
                    error.type === 'performance'}
                class:border-yellow-200={error.type === 'validation' ||
                    error.type === 'performance'}
                class:dark:border-yellow-700={error.type === 'validation' ||
                    error.type === 'performance'}
                class:text-yellow-800={error.type === 'validation' ||
                    error.type === 'performance'}
                class:dark:text-yellow-200={error.type === 'validation' ||
                    error.type === 'performance'}
            >
                <div class="flex-shrink-0 pt-0.5">
                    <!-- Icon based on error type -->
                    {#if error.type === 'runtime' || error.type === 'generic'}
                        <svg
                            class="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    {:else}
                        <svg
                            class="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    {/if}
                </div>
                <div class="flex-1">
                    <p>{error.message}</p>
                </div>
                <div class="flex-shrink-0">
                    <button
                        onclick={() => dismiss(error.id)}
                        class="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-label="Dismiss error"
                    >
                        <svg
                            class="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        {/each}
    </div>
{/if}

<script lang="ts">
    import type { ThemeMode } from '../types';
    import { applyTheme, storeTheme } from '../theme';

    interface Props {
        theme: ThemeMode;
        onThemeChange: (newTheme: ThemeMode) => void;
    }

    let { theme, onThemeChange } = $props();

    function toggleTheme() {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        storeTheme(newTheme);
        onThemeChange(newTheme);
    }
</script>

<button
    class="btn btn-secondary flex items-center gap-2 transition-all duration-200 hover:scale-105"
    onclick={toggleTheme}
    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
>
    {#if theme === 'dark'}
        <!-- Sun icon for switching to light mode -->
        <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
        </svg>
        <span class="hidden sm:inline">Light</span>
    {:else}
        <!-- Moon icon for switching to dark mode -->
        <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            ></path>
        </svg>
        <span class="hidden sm:inline">Dark</span>
    {/if}
</button>

<style>
    button {
        /* Additional smooth transitions for theme switching */
        transition: all 0.2s ease-in-out;
    }

    button:hover {
        transform: scale(1.05);
    }

    button:active {
        transform: scale(0.95);
    }
</style>

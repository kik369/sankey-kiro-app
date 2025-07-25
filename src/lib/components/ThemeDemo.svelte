<script lang="ts">
    import { themeStore } from '../stores/theme.svelte';
</script>

<div
    class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6"
>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Theme System Demo
    </h3>

    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <span class="text-gray-700 dark:text-gray-300">Current Theme:</span>
            <span
                class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm"
            >
                {themeStore.mode}
            </span>
        </div>

        <div class="flex items-center justify-between">
            <span class="text-gray-700 dark:text-gray-300">Is Dark Mode:</span>
            <span
                class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm"
            >
                {themeStore.isDark}
            </span>
        </div>

        <div class="flex items-center justify-between">
            <span class="text-gray-700 dark:text-gray-300"
                >Background Color:</span
            >
            <span
                class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm"
            >
                {themeStore.config.colors.background}
            </span>
        </div>

        <div class="flex items-center justify-between">
            <span class="text-gray-700 dark:text-gray-300">Text Color:</span>
            <span
                class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm"
            >
                {themeStore.config.colors.text}
            </span>
        </div>
    </div>

    <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded border">
        <p class="text-sm text-gray-600 dark:text-gray-400">
            This demo shows the theme system working with reactive updates. Try
            clicking the theme toggle button to see the values change in
            real-time.
        </p>
    </div>
</div>

<script lang="ts">
    import App from '../lib/components/App.svelte';
</script>

<svelte:head>
    <title>Sankey Kiro App</title>
    <meta
        name="description"
        content="A dynamic Sankey diagram generator built with Svelte and ECharts."
    />
</svelte:head>

<div
    class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
>
    <App />
</div>

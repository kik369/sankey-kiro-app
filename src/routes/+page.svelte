<script lang="ts">
    import { onMount } from 'svelte';
    import App from '$lib/components/App.svelte';
    import { addStylingTest } from '$lib/utils/styling-diagnostics.js';

    // Initialize styling diagnostics in development
    onMount(() => {
        if (import.meta.env.DEV) {
            setTimeout(() => addStylingTest(), 1000);
        }
    });
</script>

<App />

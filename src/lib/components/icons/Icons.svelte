<script lang="ts">
    export type IconName =
        | 'check'
        | 'warning'
        | 'arrow-up'
        | 'arrow-down'
        | 'arrow-flat'
        | 'sun'
        | 'moon';
    let {
        name,
        size = 24,
        className = '',
        children,
    }: {
        name: IconName;
        size?: number;
        className?: string;
        children?: () => any;
    } = $props();
    const paths: Record<IconName, string> = {
        check: 'M5 13l4 4L19 7',
        warning:
            'M12 9v2m0 4h.01M4.93 19h14.14c1.2 0 1.97-1.3 1.36-2.35L13.36 5.65a1.5 1.5 0 00-2.72 0L3.57 16.65C2.96 17.7 3.73 19 4.93 19z',
        'arrow-up': 'M4 16l6-6 6 6',
        'arrow-down': 'M4 8l6 6 6-6',
        'arrow-flat': 'M4 12h12',
        sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
        moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    };
</script>

<svg
    class={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d={paths[name]}
    />
    {@render children?.()}
</svg>

<style>
    svg {
        display: inline-block;
    }
    :global(.icon-muted) {
        color: rgb(107 114 128);
    }
    :global(.dark .icon-muted) {
        color: rgb(156 163 175);
    }
</style>

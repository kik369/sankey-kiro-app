# Technology Stack & Build System

## 🚨 MANDATORY TECH STACK - NO SUBSTITUTIONS ALLOWED

**CRITICAL**: This project uses a specific, non-negotiable technology stack:

-   **Frontend Framework**: Svelte 5 with runes (reactive state management)
-   **Application Framework**: SvelteKit for routing and SSR
-   **Runtime & Package Manager**: Bun (NEVER use npm, yarn, or pnpm)
-   **Build Tool**: Vite (integrated with SvelteKit)
-   **Charting Library**: Apache ECharts for Sankey diagrams
-   **Styling**: Tailwind CSS with dark/light theme support
-   **Language**: TypeScript for type safety
-   **CSS Processing**: PostCSS with Autoprefixer

## Essential Commands

**CRITICAL**: Always use Bun - never npm/yarn/pnpm

```bash
# Development
bun run dev          # Start dev server (localhost:5173)
bun run build        # Production build
bun run preview      # Preview production build

# Type checking
bun run check        # Run type checker
bun run check:watch  # Type checker in watch mode

# Package management
bun install          # Install dependencies
bun add <package>    # Add dependency
bun add -d <package> # Add dev dependency
bun remove <package> # Remove package
bun update          # Update all packages
```

## Key Libraries & Versions

-   **Svelte**: 5.0.0 (with runes)
-   **SvelteKit**: 2.0.0
-   **ECharts**: ^5.6.0 (for Sankey diagrams)
-   **Tailwind CSS**: 3.4.0
-   **TypeScript**: ^5.0.0
-   **Vite**: ^5.0.0

## Development Guidelines

### State Management

-   Use Svelte 5 runes: `$state`, `$derived`, `$effect`
-   Persist important data in localStorage
-   Keep component state minimal and focused

### Styling

-   Use Tailwind CSS classes exclusively
-   Follow dark/light theme patterns with `dark:` prefix
-   Use custom CSS components defined in app.css for reusable styles

### Performance

-   Implement debouncing for rapid input changes
-   Optimize chart re-rendering with Svelte's reactivity
-   Target modern browsers (Chrome 87+, Firefox 78+, Safari 14+, Edge 88+)

### Error Handling

-   Implement graceful fallbacks for chart rendering
-   Provide clear validation messages for user input
-   Use error boundaries to prevent crashes

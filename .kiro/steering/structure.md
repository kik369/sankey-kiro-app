# Project Structure & Organization

## Directory Layout

```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   │   ├── DataInput.svelte
│   │   ├── SankeyChart.svelte
│   │   ├── ThemeToggle.svelte
│   │   └── ControlPanel.svelte
│   └── types.ts            # TypeScript type definitions
├── routes/
│   └── +page.svelte        # Main application page (SvelteKit routing)
├── app.css                 # Global styles with Tailwind
├── app.html               # HTML template
└── app.d.ts               # TypeScript declarations
```

## Configuration Files

```
├── .kiro/                  # Kiro AI assistant configuration
├── .svelte-kit/           # SvelteKit generated files (auto-generated)
├── node_modules/          # Dependencies (managed by Bun)
├── static/                # Static assets (favicon, etc.)
├── svelte.config.js       # Svelte configuration
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── bun.lock              # Bun lockfile (DO NOT modify manually)
```

## Component Organization

### Core Components

-   **DataInput.svelte**: Handles flow data entry (source, target, value)
-   **SankeyChart.svelte**: ECharts integration and chart rendering
-   **ThemeToggle.svelte**: Dark/light theme switching
-   **ControlPanel.svelte**: Clear data and additional controls

### Component Naming Conventions

-   Use PascalCase for component files: `ComponentName.svelte`
-   Use descriptive, action-oriented names
-   Keep components focused on single responsibilities

## File Naming & Structure Rules

### TypeScript Files

-   Use `.ts` extension for pure TypeScript
-   Use `.svelte` extension for Svelte components
-   Define types in `src/lib/types.ts`

### Styling Approach

-   Global styles in `src/app.css`
-   Component-specific styles using Tailwind classes
-   Custom utility classes defined in app.css `@layer components`

### State Management

-   Use Svelte 5 runes within components
-   Keep global state minimal
-   Persist user preferences (theme) in localStorage

## Import Conventions

```typescript
// External libraries first
import { onMount } from 'svelte';
import * as echarts from 'echarts';

// Internal types and utilities
import type { FlowData, SankeyChartData } from '$lib/types';

// Component imports
import DataInput from '$lib/components/DataInput.svelte';
```

## Development Workflow

1. **Component Development**: Create in `src/lib/components/`
2. **Type Definitions**: Add to `src/lib/types.ts`
3. **Routing**: Use SvelteKit's file-based routing in `src/routes/`
4. **Styling**: Apply Tailwind classes, define utilities in app.css
5. **Testing**: Components should be self-contained and testable

## Build Output

-   **Development**: Served from memory via Vite dev server
-   **Production**: Built to `.svelte-kit/output/` (auto-managed)
-   **Static Assets**: Served from `static/` directory

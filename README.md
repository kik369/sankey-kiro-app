# Sankey Diagram App

A real-time Sankey diagram visualization tool built with modern web technologies. Create and visualize data flows with immediate updates and beautiful theming.

## 🚀 Technology Stack

**CRITICAL: This project uses a specific tech stack - NO SUBSTITUTIONS ALLOWED**

-   **Frontend Framework**: [Svelte 5](https://svelte.dev/) with runes for reactive state management
-   **Application Framework**: [SvelteKit](https://kit.svelte.dev/) for routing and SSR capabilities
-   **Runtime & Package Manager**: [Bun](https://bun.sh/) (NEVER use npm, yarn, or pnpm)
-   **Build Tool**: [Vite](https://vitejs.dev/) (integrated with SvelteKit)
-   **Charting Library**: [Apache ECharts](https://echarts.apache.org/) for Sankey diagram rendering
-   **Styling Framework**: [Tailwind CSS](https://tailwindcss.com/) with dark/light theme support
-   **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
-   **CSS Processing**: PostCSS with Autoprefixer for browser compatibility

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

-   **Bun** (latest version) - [Installation Guide](https://bun.sh/docs/installation)
-   **Node.js** (for compatibility, but we use Bun for everything)

### Installing Bun

**Windows (PowerShell):**

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS/Linux:**

```bash
curl -fsSL https://bun.sh/install | bash
```

## 🛠️ Development Setup

**IMPORTANT: Use ONLY Bun commands - NEVER use npm, yarn, or pnpm**

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd sankey-diagram-app

# Install dependencies (MUST use Bun)
bun install
```

### 2. Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run check

# Type checking with watch mode
bun run check:watch
```

### 3. Package Management

```bash
# Add new dependencies
bun add <package-name>

# Add development dependencies
bun add -d <package-name>

# Remove packages
bun remove <package-name>

# Update dependencies
bun update
```

## 🎨 Features

-   **Real-time Visualization**: Input data and see Sankey diagrams update instantly
-   **Interactive Interface**: Add, remove, and modify data flows dynamically
-   **Theme Support**: Dark and light themes with automatic persistence
-   **Responsive Design**: Works seamlessly across different screen sizes
-   **Type Safety**: Full TypeScript support for better development experience
-   **Performance Optimized**: Built with Svelte 5 runes for efficient reactivity

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/          # Svelte components
│   │   ├── DataInput.svelte
│   │   ├── SankeyChart.svelte
│   │   ├── ThemeToggle.svelte
│   │   └── ControlPanel.svelte
│   └── types.ts            # TypeScript type definitions
├── routes/
│   └── +page.svelte        # Main application page
├── app.css                 # Global styles with Tailwind
├── app.html                # HTML template
└── app.d.ts               # TypeScript declarations

Configuration Files:
├── svelte.config.js        # Svelte configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## 🎯 Usage

1. **Start the development server**:

    ```bash
    bun run dev
    ```

2. **Open your browser** and navigate to `http://localhost:5173`

3. **Create Sankey diagrams**:
    - Enter source, target, and value data
    - Add multiple flows using the "Add Flow" button
    - Watch the diagram update in real-time
    - Switch between dark and light themes
    - Clear all data to start fresh

## 🔧 Configuration

### Theme Configuration

The app supports dark and light themes with automatic persistence. The default theme is dark mode. Theme settings are stored in localStorage and persist across sessions.

### Chart Configuration

ECharts Sankey diagrams are configured with:

-   Smooth curves and gradients
-   Interactive hover effects
-   Responsive sizing
-   Theme-aware colors

## 📚 Development Guidelines

### Code Style

-   Use TypeScript for all new code
-   Follow Svelte 5 runes patterns for reactivity
-   Use Tailwind CSS classes for styling
-   Implement proper error handling
-   Write descriptive component props and types

### State Management

-   Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactive state
-   Persist important data in localStorage
-   Keep component state minimal and focused

### Performance

-   Implement debouncing for rapid input changes
-   Use efficient data transformation pipelines
-   Optimize chart re-rendering with Svelte's reactivity

## 🚨 Important Notes

### Package Manager

**CRITICAL**: This project MUST use Bun for all package management and script execution. Using npm, yarn, or pnpm will cause compatibility issues and is strictly forbidden.

### Dependencies

All dependencies are carefully chosen for compatibility with the Svelte 5 + Bun stack. Do not add or modify dependencies without understanding their impact on the build system.

### Browser Support

The application targets modern browsers with ES2020+ support:

-   Chrome 87+
-   Firefox 78+
-   Safari 14+
-   Edge 88+

## 🐛 Troubleshooting

### Development Server Issues

If the development server fails to start:

1. Ensure you're using Bun (not npm/yarn)
2. Clear node_modules and reinstall:
    ```bash
    rm -rf node_modules
    bun install
    ```
3. Check that all dependencies are compatible

### Build Issues

If builds fail:

1. Run type checking: `bun run check`
2. Ensure all imports are correct
3. Verify Tailwind CSS configuration

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

---

**Remember: Always use Bun for package management and script execution. This is not optional.**

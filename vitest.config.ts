import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/lib/tests/setup.ts']
  },
  resolve: {
    alias: {
      '$app/environment': new URL('./src/lib/tests/mocks/app-environment.ts', import.meta.url).pathname
    }
  }
});

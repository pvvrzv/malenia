/// <reference types="vitest" />

import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    target: 'es2017',
    outDir: 'build',
    minify: false,
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'malenia',
      fileName: 'index',
      formats: ['es'],
    },
  },
  resolve: {
    alias: {
      '@src': resolve(import.meta.dirname, './src'),
      '@core': resolve(import.meta.dirname, './src/core'),
      '@shared': resolve(import.meta.dirname, './src/shared'),
      '@build': resolve(import.meta.dirname, './build'),
    },
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    watch: false,
    globals: true,
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
    workspace: [
      {
        include: ['test/**/*.browser.spec.{js,ts}'],
        extends: true,
        test: {
          environment: 'jsdom',
        },
      },
    ],
  },
});

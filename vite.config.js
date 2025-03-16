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
      entry: resolve(__dirname, './lib/index.ts'),
      name: 'malenia',
      fileName: 'index',
      formats: ['es'],
    },
  },
  resolve: {
    alias: {
      '@lib': resolve(import.meta.dirname, './lib'),
      '@core': resolve(import.meta.dirname, './lib/core'),
      '@shared': resolve(import.meta.dirname, './lib/shared'),
      '@build': resolve(import.meta.dirname, './build'),
    },
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    watch: false,
    globals: true,
    environmentMatchGlobs: [['**/*.dom.spec.js', 'jsdom']],
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
  },
});

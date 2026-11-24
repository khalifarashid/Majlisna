/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://<user>.github.io/Majlisna/ on GitHub Pages.
export default defineConfig({
  base: '/Majlisna/',
  plugins: [react(), tailwindcss()],
  // The Anthropic SDK is split into its own lazy chunk; the main bundle is React + Motion.
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

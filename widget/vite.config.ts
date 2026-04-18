import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Build is invoked from the repo root:
//   vite build --config widget/vite.config.ts
// Source lives in widget/, output lands in public/widget.js so the
// Next.js app serves it at /widget.js.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: resolve(__dirname, '../public'),
    emptyOutDir: false, // CRITICAL — do not wipe public/
    lib: false,
    rollupOptions: {
      input: resolve(__dirname, 'main.tsx'),
      output: {
        format: 'iife',
        entryFileNames: 'widget.js',
        inlineDynamicImports: true,
      },
    },
    sourcemap: false,
    target: 'es2020',
  },
});

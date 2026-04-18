import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'widget',
  build: {
    outDir: resolve(__dirname, 'dist/widget'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'widget/main.tsx'),
      output: {
        entryFileNames: 'widget.js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 3101,
    proxy: {
      '/api': 'http://localhost:3100',
      '/admin': 'http://localhost:3100',
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-electron-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      include: ['electron']
    })
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: true // Listen on all network interfaces
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});

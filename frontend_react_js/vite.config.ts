import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PUBLIC_INTERFACE
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  define: {
    'process.env': {}
  }
});

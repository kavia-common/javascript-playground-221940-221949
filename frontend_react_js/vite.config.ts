import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PUBLIC_INTERFACE
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Bind to all interfaces so preview system can reach it
    host: true, // equivalent to 0.0.0.0
    strictPort: true // fail if 3000 is not available, do not auto-increment
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true
  },
  define: {
    'process.env': {}
  }
});

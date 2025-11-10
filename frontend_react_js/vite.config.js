/**
 * Vite configuration for React SPA.
 * - Binds dev server to 0.0.0.0 on port 3000
 * - Respects environment variables via import.meta.env
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Fall back to default port 3000 if REACT_APP_PORT is not provided
  const port = Number(env.REACT_APP_PORT || 3000);

  return {
    plugins: [react()],
    server: {
      host: true,            // 0.0.0.0
      port: 3000,            // explicit default
      strictPort: true
    },
    preview: {
      host: true,
      port: 3000
    },
    build: {
      sourcemap: env.REACT_APP_ENABLE_SOURCE_MAPS === 'true'
    },
    define: {
      // Expose commonly used env variables for client
      __APP_ENV__: JSON.stringify({
        API_BASE: env.REACT_APP_API_BASE || '',
        BACKEND_URL: env.REACT_APP_BACKEND_URL || '',
        FRONTEND_URL: env.REACT_APP_FRONTEND_URL || '',
        WS_URL: env.REACT_APP_WS_URL || '',
        NODE_ENV: env.REACT_APP_NODE_ENV || '',
        LOG_LEVEL: env.REACT_APP_LOG_LEVEL || 'info',
        FEATURES: env.REACT_APP_FEATURE_FLAGS || '',
        EXPERIMENTS_ENABLED: env.REACT_APP_EXPERIMENTS_ENABLED || 'false'
      })
    }
  };
});

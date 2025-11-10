import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Simple healthcheck middleware plugin
function healthcheckPlugin(path = '/healthz') {
  return {
    name: 'healthcheck-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === path) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }
        next();
      });
    },
  };
}

// PUBLIC_INTERFACE
export default defineConfig(() => {
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3000);

  return {
    plugins: [react(), healthcheckPlugin(process.env.REACT_APP_HEALTHCHECK_PATH || '/healthz')],
    server: {
      host: host === '0.0.0.0' ? true : host, // true means 0.0.0.0
      port,
      strictPort: true
    },
    preview: {
      host: true,
      port: port
    },
    // Make sure env vars prefixed with REACT_APP_ are loaded
    envPrefix: ['REACT_APP_', 'VITE_'],
    logLevel: 'info'
  };
});

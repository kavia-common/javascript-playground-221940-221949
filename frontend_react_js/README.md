# frontend_react_js

A lightweight React + Vite SPA providing a minimal JavaScript playground.

## Theme (Light/Dark)

- Use the "Dark Mode"/"Light Mode" button in the header to toggle themes.
- Your preference is saved to localStorage and will be automatically applied on next visit.
- On first load, the app respects your system preference (prefers-color-scheme).

## Scripts

- npm run dev — start Vite dev server on 0.0.0.0:3000 (BROWSER=none)
- npm start — alias of dev
- npm run build — build for production
- npm run preview — preview production build on 0.0.0.0:3000

The dev server binds to 0.0.0.0 and uses port 3000 by default; it respects REACT_APP_PORT if provided.

## Environment

These environment variables are supported (optional):

- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL
- REACT_APP_FRONTEND_URL
- REACT_APP_WS_URL
- REACT_APP_NODE_ENV
- REACT_APP_ENABLE_SOURCE_MAPS
- REACT_APP_PORT
- REACT_APP_TRUST_PROXY
- REACT_APP_LOG_LEVEL
- REACT_APP_HEALTHCHECK_PATH
- REACT_APP_FEATURE_FLAGS
- REACT_APP_EXPERIMENTS_ENABLED

Do not commit .env files. Provide them via deployment configuration.

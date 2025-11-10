# Frontend React JS

Development:
- npm start (Vite dev server)
- Health check at `/healthz` (configurable via REACT_APP_HEALTHCHECK_PATH)

Server:
- Binds to 0.0.0.0 (host=true) and uses PORT env or defaults to 3001
- Does not auto-open a browser

Environment:
- HOST=0.0.0.0
- PORT=3001 (override with PORT or REACT_APP_PORT)
- BROWSER=none
- REACT_APP_HEALTHCHECK_PATH=/healthz

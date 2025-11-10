# Frontend React JS

Development:
- npm start (Vite dev server)
- Health check at `/healthz` (configurable via REACT_APP_HEALTHCHECK_PATH)

Server:
- Binds to 0.0.0.0 (host=true) and uses PORT env or defaults to 3000
- Does not auto-open a browser

Environment:
- HOST=0.0.0.0
- PORT=3000
- BROWSER=none
- REACT_APP_HEALTHCHECK_PATH=/healthz

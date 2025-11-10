# JS Playground (frontend_react_js)

A simple web-based JavaScript runner where users can write and execute JavaScript code directly in the browser. No backend or database required.

## Features
- Code editor (textarea) with Ctrl/Cmd + Enter to run
- Run button
- Output display area showing `console.log` and errors
- Safe execution in a sandboxed iframe
- Light, modern styling with accents:
  - Primary: `#3b82f6`
  - Success: `#06b6d4`

## Getting started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server (port 3000, bound to 0.0.0.0):
   ```
   npm start
   ```
   The dev server will listen on http://0.0.0.0:3000 (reachable via http://localhost:3000 on the same machine).

3. Build for production:
   ```
   npm run build
   ```

4. Preview the production build locally:
   ```
   npm run preview
   ```

## Environment variables

This app works without any environment variables. If needed, you can provide compatible variables:

- `VITE_API_BASE` (or `REACT_APP_API_BASE`)
- `VITE_BACKEND_URL` (or `REACT_APP_BACKEND_URL`)
- `VITE_NODE_ENV` (or `REACT_APP_NODE_ENV`)

Define them in a `.env` file at the project root (not committed by default). Example:

```
VITE_NODE_ENV=development
```

## Notes

- The code executes in a sandboxed iframe (`sandbox="allow-scripts"`) to minimize risk.
- The console output from the sandbox is captured via `postMessage` and displayed in the Output panel.

## Scripts

- `npm start` - start dev server on port 3000
- `npm run dev` - same as start
- `npm run build` - typecheck and build
- `npm run preview` - preview the production build
- `npm run lint` - run eslint

## Tech stack

- React 18
- Vite
- TypeScript

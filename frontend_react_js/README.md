# JS Playground (React)

A simple web-based JavaScript runner where users can write and execute JavaScript code directly in the browser. Includes light/dark theme support with persistent preference.

## Available Scripts

- `npm install`
- `npm start` – Start development server
- `npm run build` – Production build
- `npm test` – Run tests (CI mode)

## Theme

- Default theme: Light
- Toggle between Light and Dark using the moon/sun button in the header
- Preference persists via `localStorage` key `ui.theme`
- The theme is applied via `data-theme` attribute on `<html>` and CSS variables defined in `src/styles/variables.css`

## Features

- Code editor (textarea)
- Run button to execute JavaScript in a sandboxed Function
- Output area showing console logs and errors

## Notes

- No backend required.
- Accent colors follow the style guide: primary `#3b82f6`, success `#06b6d4`.

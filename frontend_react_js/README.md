# JavaScript Runner (React SPA)

A lightweight browser-based JavaScript runner built with React. Write JS in the editor, run it in a sandboxed iframe, and view output in the console — no backend required.

## Features
- Textarea-based editor with monospace font and simple line numbers
- Run button and keyboard shortcut (Ctrl/Cmd + Enter)
- Output console with log/warn/error/status messages and timestamps
- Sandboxed execution (iframe with `allow-scripts`) and 5s watchdog timeout
- Clean, responsive UI following a light theme palette

## Getting Started

In the project directory, run:

### `npm start`
Starts the app in development mode.  
Open http://localhost:3000 in your browser.

### `npm test`
Runs the test suite.

### `npm run build`
Builds the app for production to the `build` folder.

## How to Use
1. Type JavaScript in the editor (default: `console.log('Hello, JS Runner');`).
2. Click Run or press Ctrl/Cmd + Enter to execute.
3. View logs, warnings, and errors in the Output pane.
4. Click Clear to clear the output.

## Notes and Limitations
- Code runs in a sandboxed iframe with `allow-scripts` only; DOM access is limited to the iframe itself.
- Network access and cross-origin interactions are restricted by the browser sandbox.
- Each run creates a fresh iframe to avoid state leaks.
- A 5s watchdog terminates long-running or hanging executions and reports a timeout error.

## Styling
- Light theme palette:
  - primary `#3b82f6`, secondary `#64748b`, success `#06b6d4`, error `#EF4444`
  - background `#f9fafb`, surface `#ffffff`, text `#111827`
- CSS variables defined in `src/assets/styles/variables.css`.

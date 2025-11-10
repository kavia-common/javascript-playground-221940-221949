import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// PUBLIC_INTERFACE
function renderApp() {
  /**
   * This is the main render entrypoint for the React app.
   * It mounts the App component to the root DOM node.
   */
  const el = document.getElementById('root');
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

renderApp();

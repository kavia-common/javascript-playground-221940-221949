import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  // PUBLIC_INTERFACE
  // A minimal error thrown if mount node is missing; helps readiness/diagnostics.
  throw new Error('Root element with id="root" not found in index.html');
}

const root = createRoot(rootEl);

function AppWithReadyLog() {
  useEffect(() => {
    // Extra readiness log to stdout after the app mounts.
    // Some preview detectors look for any stdout once the server is up.
    console.log('[ready] React app mounted');
  }, []);
  return <App />;
}

root.render(
  <React.StrictMode>
    <AppWithReadyLog />
  </React.StrictMode>
);

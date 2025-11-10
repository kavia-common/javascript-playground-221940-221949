import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';
import EditorTabs from './components/EditorTabs';
import ConsolePanel from './components/ConsolePanel';
import { runPreview } from './utils/previewRunner';
import { runInSandbox } from './utils/runSandbox';

// Seed defaults
const DEFAULT_HTML = `<!-- Minimal HTML boilerplate -->
<div id="app">
  <h1>Hello, Preview!</h1>
  <p>Edit HTML, CSS, and JS, then Run/Preview.</p>
</div>`;
const DEFAULT_CSS = `body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 16px; }
#app { border: 1px dashed #e5e7eb; padding: 12px; border-radius: 8px; }
h1 { color: #111827; }
p { color: #334155; }`;
const DEFAULT_JS = `console.log('Hello from JS!');
const app = document.getElementById('app');
if (app) {
  const el = document.createElement('div');
  el.textContent = 'JS executed successfully.';
  el.style.color = '#06b6d4';
  app.appendChild(el);
}`;

// Keys for localStorage
const LS_KEYS = {
  html: 'preview_html',
  css: 'preview_css',
  js: 'preview_js',
  autorun: 'preview_autorun',
};

// PUBLIC_INTERFACE
function App() {
  // Load from localStorage if available
  const [html, setHtml] = useState(() => localStorage.getItem(LS_KEYS.html) ?? DEFAULT_HTML);
  const [css, setCss] = useState(() => localStorage.getItem(LS_KEYS.css) ?? DEFAULT_CSS);
  const [js, setJs] = useState(() => localStorage.getItem(LS_KEYS.js) ?? DEFAULT_JS);

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [autoRun, setAutoRun] = useState(() => (localStorage.getItem(LS_KEYS.autorun) ?? 'true') === 'true');

  const previewContainerRef = useRef(null);
  const cleanupRef = useRef(null);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(LS_KEYS.html, String(html)); }, [html]);
  useEffect(() => { localStorage.setItem(LS_KEYS.css, String(css)); }, [css]);
  useEffect(() => { localStorage.setItem(LS_KEYS.js, String(js)); }, [js]);
  useEffect(() => { localStorage.setItem(LS_KEYS.autorun, String(autoRun)); }, [autoRun]);

  // Append message helper
  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, time: msg.time ?? new Date().toISOString() }]);
  }, []);

  const clearConsole = useCallback(() => setMessages([]), []);

  // Run/Preview combined flow (HTML/CSS/JS)
  const onRunPreview = useCallback(() => {
    setStatus('Running…');
    // Clear previous sandbox if any
    if (typeof cleanupRef.current === 'function') {
      try { cleanupRef.current(); } catch (_) {}
      cleanupRef.current = null;
    }
    // Emit status
    appendMessage({ type: 'status', text: 'Preview started' });

    try {
      const { cleanup } = runPreview({
        container: previewContainerRef.current,
        html,
        css,
        js,
        onMessage: (m) => appendMessage(m),
        onComplete: () => {
          setStatus('Completed');
          appendMessage({ type: 'status', text: 'Preview completed' });
        },
        onTimeout: () => {
          setStatus('Error');
          appendMessage({ type: 'error', text: 'Preview timed out after 5s.' });
        },
        onError: (err) => {
          setStatus('Error');
          appendMessage({ type: 'error', text: err?.message || String(err) });
        }
      });
      cleanupRef.current = cleanup;
    } catch (err) {
      setStatus('Error');
      appendMessage({ type: 'error', text: err?.message || String(err) });
    }
  }, [appendMessage, html, css, js]);

  // Keyboard shortcut: Ctrl/Cmd+Enter to run
  useEffect(() => {
    const handler = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        onRunPreview();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRunPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof cleanupRef.current === 'function') {
        try { cleanupRef.current(); } catch (_) {}
      }
    };
  }, []);

  const headerStatusColor = useMemo(() => {
    if (status === 'Ready') return 'status-ready';
    if (status === 'Running…') return 'status-running';
    if (status === 'Completed') return 'status-completed';
    return 'status-error';
  }, [status]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">
          <span className="brand-dot" />
          <h1>HTML/CSS/JS Previewer</h1>
        </div>
        <div className={`status-pill ${headerStatusColor}`} aria-live="polite">
          {status}
        </div>
      </header>

      <main className="app-main">
        <section className="editor-pane" aria-label="Editors pane">
          <EditorTabs
            htmlValue={html}
            cssValue={css}
            jsValue={js}
            onHtmlChange={setHtml}
            onCssChange={setCss}
            onJsChange={setJs}
            onRun={onRunPreview}
            autoRun={autoRun}
            setAutoRun={setAutoRun}
          />
        </section>

        <section className="output-pane" aria-label="Output and preview pane">
          <div className="pane-header">
            <h2>Preview</h2>
          </div>
          <div ref={previewContainerRef} style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-secondary-200)' }} />
          <ConsolePanel messages={messages} onClear={clearConsole} />
        </section>
      </main>
    </div>
  );
}

export default App;

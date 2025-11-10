import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
PUBLIC_INTERFACE
App
/** A minimal JavaScript playground with:
 - left: code editor textarea + run/clear buttons
 - right: output panel that displays console.log and errors
 Executes code inside a sandboxed iframe and communicates via postMessage.

 Theme:
 - Supports light and dark themes using CSS variables.
 - Theme is persisted in localStorage and respects prefers-color-scheme on first load.
*/
export default function App() {
  const [code, setCode] = useState(`// Welcome to the JavaScript Playground!
// Write some JS and click "Run".
// console.log outputs will appear on the right.
// Errors are captured as well.

function greet(name){
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`);
  const [logs, setLogs] = useState([]);
  const iframeRef = useRef(null);

  // Theme setup
  const THEME_KEY = 'theme';
  const getPreferredTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState(getPreferredTheme);

  // Apply theme to documentElement so CSS can respond
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // Create a sandboxed HTML for the iframe each run.
  const sandboxHtml = useMemo(() => {
    // This script runs inside the iframe, intercepts console and errors, and reports via postMessage
    const interceptScript = `
      (function(){
        const styles = 'color:#fff;background:#3b82f6;padding:2px 6px;border-radius:6px;';
        const send = (type, payload) => parent.postMessage({ source:'js-playground', type, payload }, '*');

        // Intercept console methods
        ['log','info','warn','error'].forEach(m => {
          const original = console[m];
          console[m] = function(...args){
            try{
              send('log', { level: m, args: args.map(format) });
            } catch(e){}
            original.apply(console, args);
          }
        });

        // Capture errors
        window.onerror = function(message, source, lineno, colno, error){
          send('error', { message: String(message), source, lineno, colno, stack: error && error.stack ? String(error.stack) : '' });
        };

        window.addEventListener('unhandledrejection', function(e){
          send('error', { message: String(e.reason), source: 'promise', lineno: 0, colno: 0, stack: e.reason && e.reason.stack ? String(e.reason.stack) : '' });
        });

        function format(v){
          try{
            if (typeof v === 'string') return v;
            if (typeof v === 'function') return v.toString();
            return JSON.stringify(v, null, 2);
          }catch(e){
            try { return String(v); } catch(_){ return '[Unserializable]'; }
          }
        }

        // Receive code from parent and execute
        window.addEventListener('message', (ev) => {
          if (!ev || !ev.data || ev.data.source !== 'js-playground-parent') return;
          const { code } = ev.data;
          try{
            // Use new Function to create an isolated scope
            const fn = new Function(code);
            const result = fn();
            if (result !== undefined) {
              console.log(result);
            }
            send('done', {});
          }catch(err){
            send('error', { message: String(err.message || err), stack: err && err.stack ? String(err.stack) : '' });
          }
        });

        // Signal ready
        send('ready', {});
      })();
    `.trim();

    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root{
        --color-primary:#3b82f6;
        --color-secondary:#64748b;
        --color-success:#06b6d4;
        --color-error:#EF4444;
        --color-bg:#f9fafb;
        --color-surface:#ffffff;
        --color-text:#111827;
      }
      [data-theme="dark"]{
        --color-bg:#0b1020;
        --color-surface:#0f172a;
        --color-text:#e5e7eb;
        --color-secondary:#94a3b8;
      }
      html, body {
        background: var(--color-bg);
        color: var(--color-text);
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
      }
    </style>
    <script>
      ${interceptScript}
    </script>
  </head>
  <body></body>
</html>
    `.trim();
  }, []);

  useEffect(() => {
    const onMessage = (ev) => {
      const data = ev?.data;
      if (!data || data.source !== 'js-playground') return;
      if (data.type === 'log') {
        setLogs((prev) => [...prev, { type: 'log', level: data.payload.level, text: data.payload.args.join(' ') }]);
      } else if (data.type === 'error') {
        const text = [data.payload.message, data.payload.stack].filter(Boolean).join('\n');
        setLogs((prev) => [...prev, { type: 'error', text }]);
      } else if (data.type === 'ready') {
        // no-op
      } else if (data.type === 'done') {
        // no-op
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const runCode = () => {
    // Reset iframe content to clear previous state and logs
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(sandboxHtml);
      doc.close();

      // Slight delay to allow iframe to initialize
      setTimeout(() => {
        iframe.contentWindow.postMessage({ source: 'js-playground-parent', code }, '*');
      }, 20);
    }
    setLogs([]); // clear logs on run
  };

  const clearOutput = () => setLogs([]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" aria-hidden="true"></div>
          <div className="title">JavaScript Playground</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="button secondary"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="content" role="main">
        <section className="panel" aria-label="Code editor">
          <div className="panel-header">
            <div className="panel-title">Editor</div>
            <div className="controls">
              <button className="button secondary" onClick={clearOutput} title="Clear output">Clear Output</button>
              <button className="button" onClick={runCode} title="Run the code">Run ▶</button>
            </div>
          </div>
          <textarea
            className="textarea"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="JavaScript code editor"
          />
        </section>

        <section className="panel" aria-label="Output">
          <div className="panel-header">
            <div className="panel-title">Output</div>
          </div>
          <div className="output" aria-live="polite">
            {logs.length === 0 ? (
              <span style={{ color: 'var(--color-secondary)' }}>
                Output will appear here (console.log and errors).
              </span>
            ) : (
              logs.map((item, idx) => {
                const color =
                  item.type === 'error' ? 'var(--color-error)' :
                  item.level === 'warn' ? 'var(--color-warn, #ca8a04)' :
                  item.level === 'info' ? 'var(--color-success)' :
                  'var(--color-text)';
                return (
                  <div key={idx} style={{ color, marginBottom: '6px' }}>
                    {item.text}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        Built with React and Vite. Supports light and dark themes with CSS variables.
      </footer>

      {/* Hidden iframe used for sandboxed code execution */}
      <iframe
        ref={iframeRef}
        title="sandbox"
        sandbox="allow-scripts"
        style={{ display: 'none' }}
        srcDoc={sandboxHtml}
      />
    </div>
  );
}

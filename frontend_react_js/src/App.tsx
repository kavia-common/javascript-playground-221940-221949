import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * A single-page application providing:
 * - a code editor
 * - a Run button
 * - an output display area
 *
 * It executes JavaScript code in a sandboxed iframe. Logs are captured and rendered
 * in the output panel, along with runtime errors, without using any backend.
 */
export default function App() {
  // Respect env vars if provided but do not require them
  const appEnv = {
    apiBase: import.meta.env.VITE_API_BASE || (import.meta as any).env?.REACT_APP_API_BASE || '',
    backendUrl: import.meta.env.VITE_BACKEND_URL || (import.meta as any).env?.REACT_APP_BACKEND_URL || '',
    nodeEnv: import.meta.env.MODE || (import.meta as any).env?.REACT_APP_NODE_ENV || 'development'
  };

  const defaultCode = `// Welcome to the JavaScript Playground!
// Type JS below and press "Run" (or Ctrl/Cmd + Enter)
// console.log outputs will appear on the right.

function add(a, b) {
  return a + b;
}

console.log("2 + 3 =", add(2, 3));
// You can also throw errors to see error handling:
/// throw new Error("This is an example error");
`;

  const [code, setCode] = useState<string>(defaultCode);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running'>('idle');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Prepare sandbox HTML which listens for code to run and pipes console logs back
  const sandboxSrcDoc = useMemo(() => {
    const primary = '#3b82f6'; // primary accent
    const success = '#06b6d4'; // success accent
    const text = '#111827';
    const bg = '#ffffff';

    // The sandbox page will postMessage back to the parent with logs/errors
    // and override console methods to capture output.
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  :root {
    color-scheme: light;
  }
  body {
    background: ${bg};
    color: ${text};
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }
  .banner {
    display: none;
  }
</style>
</head>
<body>
<script>
  (function() {
    const send = (type, payload) => {
      parent.postMessage({ type, payload }, '*');
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      try {
        const str = args.map(a => {
          try {
            if (typeof a === 'object') return JSON.stringify(a);
            return String(a);
          } catch {
            return String(a);
          }
        }).join(' ');
        send('log', str);
      } catch {}
      try { originalLog.apply(console, args); } catch {}
    };
    console.warn = (...args) => {
      try { send('warn', args.join(' ')); } catch {}
      try { originalWarn.apply(console, args); } catch {}
    };
    console.error = (...args) => {
      try { send('error', args.join(' ')); } catch {}
      try { originalError.apply(console, args); } catch {}
    };

    window.onerror = function(message, source, lineno, colno, error) {
      send('error', (message || 'Unknown error') + ' @ ' + lineno + ':' + colno);
    };

    window.addEventListener('message', (event) => {
      if (!event || !event.data) return;
      const { type, code } = event.data;
      if (type === 'execute' && typeof code === 'string') {
        try {
          // Execute code in Function scope to avoid top-level conflicts.
          new Function(code)();
          send('done', 'Execution finished');
        } catch (err) {
          send('error', (err && err.message) ? err.message : String(err));
        }
      }
    });
  })();
</script>
</body>
</html>
    `.trim();
  }, []);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!ev.data) return;
      const { type, payload } = ev.data as { type: string; payload?: any };
      if (type === 'log') {
        setLogs(prev => [...prev, payload ?? '']);
      } else if (type === 'warn') {
        setLogs(prev => [...prev, `⚠️ ${payload ?? ''}`]);
      } else if (type === 'error') {
        setLogs(prev => [...prev, `❌ ${payload ?? ''}`]);
      } else if (type === 'done') {
        setLogs(prev => [...prev, `✅ ${payload ?? 'Done'}`]);
        setStatus('idle');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const runCode = useCallback(() => {
    setStatus('running');
    setLogs([]);
    const frame = iframeRef.current;
    if (!frame || !frame.contentWindow) {
      setLogs(prev => [...prev, '❌ Sandbox iframe not available']);
      setStatus('idle');
      return;
    }
    // Post code to iframe for execution
    frame.contentWindow.postMessage({ type: 'execute', code }, '*');
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
      e.preventDefault();
      runCode();
    }
  };

  return (
    <div className="page">
      <header className="app-header">
        <div className="brand">
          <span className="dot" />
          <h1>JS Playground</h1>
        </div>
        <div className="env">Env: {appEnv.nodeEnv}</div>
      </header>

      <main className="content">
        <section className="editor-panel">
          <div className="toolbar">
            <button
              className="run-btn"
              onClick={runCode}
              disabled={status === 'running'}
              title="Run code (Ctrl/Cmd + Enter)"
            >
              ▶ Run
            </button>
            <span className="hint">Ctrl/Cmd + Enter</span>
          </div>
          <textarea
            className="editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            aria-label="Code editor"
          />
        </section>

        <section className="output-panel">
          <div className="output-header">Output</div>
          <div className="output-body" role="log" aria-live="polite">
            {logs.length === 0 ? (
              <div className="output-empty">Console output will appear here.</div>
            ) : (
              logs.map((line, idx) => (
                <div className="log-line" key={idx}>{line}</div>
              ))
            )}
          </div>
          <iframe
            ref={iframeRef}
            title="sandbox"
            sandbox="allow-scripts" 
            srcDoc={sandboxSrcDoc}
            className="sandbox-iframe"
          />
        </section>
      </main>

      <footer className="app-footer">
        <span>
          Built with React • Accents: <span className="chip chip-primary">#3b82f6</span>
          <span className="chip chip-success">#06b6d4</span>
        </span>
      </footer>
    </div>
  );
}

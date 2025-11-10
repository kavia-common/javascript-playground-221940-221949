import React, { useState, useEffect, useRef } from 'react';

// PUBLIC_INTERFACE
export default function App() {
  /**
   * A simple JavaScript playground with code editor, run button, and output area.
   * Runs code in a sandboxed iframe context without a backend.
   */
  const [code, setCode] = useState('// Write JavaScript here\\nconsole.log("Hello from the playground!");');
  const [output, setOutput] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    // Prepare iframe document
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Sandbox</title>
          </head>
          <body>
            <pre id="out" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;"></pre>
            <script>
              (function(){
                const out = document.getElementById('out');
                function writeLine(msg) {
                  out.textContent += String(msg) + "\\n";
                  parent.postMessage({ type: 'sandbox-log', message: String(msg) }, '*');
                }
                const origLog = console.log;
                console.log = function(...args) {
                  origLog.apply(console, args);
                  writeLine(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
                };
                window.onerror = function(message, source, lineno, colno, error) {
                  writeLine('Error: ' + message + ' at ' + lineno + ':' + colno);
                };
                window.addEventListener('message', (e) => {
                  if (e.data && e.data.type === 'run-code') {
                    try {
                      out.textContent = '';
                      const fn = new Function(e.data.code);
                      fn();
                    } catch (err) {
                      writeLine('Error: ' + err.message);
                    }
                  }
                });
              })();
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.data && e.data.type === 'sandbox-log') {
        setOutput(prev => prev + e.data.message + '\n');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const run = () => {
    setOutput('');
    iframeRef.current?.contentWindow?.postMessage({ type: 'run-code', code }, '*');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9fafb', color: '#111827' }}>
      <header style={{ padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>JavaScript Playground</h1>
      </header>
      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, flex: 1 }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="editor" style={{ fontSize: 12, color: '#64748b' }}>Editor</label>
          <textarea
            id="editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              minHeight: 280,
              padding: 12,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}
            placeholder="// Write your JS here"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={run} style={{ background: '#3b82f6', color: 'white', border: 0, borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
              Run ▶
            </button>
          </div>
        </section>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#64748b' }}>Output</label>
          <pre style={{ flex: 1, minHeight: 280, padding: 12, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{output}</pre>
          <iframe
            ref={iframeRef}
            title="sandbox"
            sandbox="allow-scripts"
            style={{ display: 'none' }}
          />
        </section>
      </main>
      <footer style={{ padding: 12, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Health: <code>{import.meta.env.REACT_APP_HEALTHCHECK_PATH || '/healthz'}</code> • Port: <code>{String(import.meta.env.PORT || 3000)}</code> • Host: <code>{String(import.meta.env.HOST || '0.0.0.0')}</code>
      </footer>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';
import CodeEditor from './components/CodeEditor';
import OutputConsole from './components/OutputConsole';
import { runInSandbox } from './utils/runSandbox';

// PUBLIC_INTERFACE
function App() {
  /** App state for editor, console messages, and run status */
  const [code, setCode] = useState("console.log('Hello, JS Runner');");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('Ready');
  const iframeContainerRef = useRef(null);
  const cleanupRef = useRef(null);

  // Append message helper
  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, time: msg.time ?? new Date().toISOString() }]);
  }, []);

  const clearOutput = useCallback(() => {
    setMessages([]);
  }, []);

  const onRun = useCallback(async () => {
    setStatus('Running…');
    // Clear previous sandbox if any
    if (typeof cleanupRef.current === 'function') {
      try { cleanupRef.current(); } catch (_) {}
      cleanupRef.current = null;
    }
    // Emit status
    appendMessage({ type: 'status', text: 'Execution started' });

    try {
      const { cleanup } = runInSandbox({
        container: iframeContainerRef.current,
        code,
        onMessage: (m) => {
          appendMessage(m);
        },
        onComplete: () => {
          setStatus('Completed');
          appendMessage({ type: 'status', text: 'Execution completed' });
        },
        onTimeout: () => {
          setStatus('Error');
          appendMessage({
            type: 'error',
            text: 'Execution timed out after 5s and was terminated for safety.'
          });
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
  }, [appendMessage, code]);

  // Keyboard shortcut: Ctrl/Cmd + Enter to run
  useEffect(() => {
    const handler = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        onRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRun]);

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
          <h1>JavaScript Runner</h1>
        </div>
        <div className={`status-pill ${headerStatusColor}`} aria-live="polite">
          {status}
        </div>
      </header>

      <main className="app-main">
        <section className="editor-pane">
          <div className="pane-header">
            <h2>Editor</h2>
            <div className="controls">
              <button className="btn btn-secondary" onClick={clearOutput} aria-label="Clear console output">
                Clear
              </button>
              <button className="btn btn-primary" onClick={onRun} aria-label="Run code (Ctrl/Cmd+Enter)">
                Run
              </button>
            </div>
          </div>
          <CodeEditor value={code} onChange={setCode} onRun={onRun} />
          <div className="hint">
            Press Ctrl/Cmd + Enter to run
          </div>
        </section>

        <section className="output-pane">
          <div className="pane-header">
            <h2>Output</h2>
          </div>
          <div className="iframe-host" ref={iframeContainerRef} aria-hidden="true" />
          <OutputConsole messages={messages} />
        </section>
      </main>
    </div>
  );
}

export default App;

import React, { useCallback, useMemo, useRef, useState } from "react";
import "./styles/variables.css";
import ThemeToggle from "./components/ThemeToggle";

/**
 * PUBLIC_INTERFACE
 * App renders the JavaScript playground with editor, run button, and output area.
 */
export default function App() {
  const [code, setCode] = useState(`// Write some JavaScript and click Run
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`);
  const [output, setOutput] = useState("");
  const outputRef = useRef(null);

  const handleRun = useCallback(() => {
    // Capture console output
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;

    try {
      console.log = (...args) => {
        logs.push(args.map(a => stringify(a)).join(" "));
        originalLog(...args);
      };
      console.error = (...args) => {
        logs.push(args.map(a => stringify(a)).join(" "));
        originalError(...args);
      };

      // Run code in a Function sandbox
      // eslint-disable-next-line no-new-func
      const fn = new Function(code);
      fn();
    } catch (err) {
      logs.push(`Error: ${err && err.message ? err.message : String(err)}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setOutput(logs.join("\n"));
      // scroll output into view
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }
  }, [code]);

  const exampleSnippets = useMemo(() => [
    {
      label: "Hello loop",
      value: `for (let i = 1; i <= 3; i++) { console.log("Hello #" + i); }`,
    },
    {
      label: "Fetch example",
      value: `// Note: network may be blocked in some environments
console.log("Fetching JSON placeholder post 1...");
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then(r => r.json())
  .then(d => console.log(d.title))
  .catch(e => console.log("Fetch failed:", e.message));`
    }
  ], []);

  return (
    <div className="container">
      <div className="app-card">
        <div className="header">
          <div className="brand">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--color-primary), var(--color-success))",
                boxShadow: "var(--shadow-sm)"
              }}
              aria-hidden="true"
            />
            <div>
              JS Playground
              <span className="badge" style={{ marginLeft: 8 }}>Modern</span>
            </div>
          </div>
          <div className="controls">
            <ThemeToggle />
            <button className="button icon" onClick={handleRun}>
              ▶ Run
            </button>
          </div>
        </div>

        <div className="grid">
          <section>
            <label htmlFor="editor" style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--muted-text)" }}>
              Editor
            </label>
            <textarea
              id="editor"
              className="editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="JavaScript editor"
            />
            <div className="separator" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {exampleSnippets.map((s) => (
                <button
                  key={s.label}
                  className="button secondary"
                  onClick={() => setCode(s.value)}
                  title={`Load example: ${s.label}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <section ref={outputRef}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "var(--muted-text)" }}>
              Output
            </label>
            <pre className="output" aria-live="polite">{output || "Console output will appear here..."}</pre>
          </section>
        </div>
      </div>
    </div>
  );
}

function stringify(v) {
  try {
    if (typeof v === "string") return v;
    if (typeof v === "object") return JSON.stringify(v, null, 2);
    return String(v);
  } catch {
    return String(v);
  }
}

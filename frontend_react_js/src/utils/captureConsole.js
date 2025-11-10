export const iframeCaptureScript = `
function createConsoleCapture(channelId) {
  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  function serializeArgs(args) {
    try {
      return args.map((a) => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.message;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(' ');
    } catch {
      try { return args.join(' '); } catch { return '[unserializable output]'; }
    }
  }

  function safePost(level, payload) {
    try {
      parent.postMessage({ type: 'console', level, payload, channelId }, '*');
    } catch (e) {
      // swallow
    }
  }

  function install() {
    console.log = function(...args) {
      try { safePost('log', serializeArgs(args)); } catch {}
      return original.log(...args);
    };
    console.warn = function(...args) {
      try { safePost('warn', serializeArgs(args)); } catch {}
      return original.warn(...args);
    };
    console.error = function(...args) {
      try { safePost('error', serializeArgs(args)); } catch {}
      return original.error(...args);
    };

    window.addEventListener('error', function (e) {
      try {
        const msg = (e && e.message) ? e.message : String(e);
        safePost('error', msg);
      } catch {}
    });

    window.addEventListener('unhandledrejection', function (e) {
      try {
        const reason = e && e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled promise rejection';
        safePost('error', reason);
      } catch {}
    });
  }

  return { install };
}
`.trim();

import { iframeCaptureScript } from './captureConsole';

/**
 * PUBLIC_INTERFACE
 * runInSandbox
 * Creates a fresh sandboxed iframe and executes provided JS code within it.
 * - Sandbox: allow-scripts only
 * - Communication via postMessage
 * - Watchdog: 5s timeout triggers onTimeout and reloads iframe
 * - Returns cleanup function to remove iframe and listeners
 *
 * Cross-origin safety:
 * - Does not access parent/other frame documents.
 * - Feature-detects iframe document accessibility; uses srcdoc when needed.
 * - Validates postMessage source and origin (same-origin only).
 */
export function runInSandbox({ container, code, onMessage, onComplete, onTimeout, onError }) {
  if (!container) throw new Error('Sandbox container not available');
  // Clear previous iframe
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Create iframe (sandboxed)
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts'); // no same-origin, no top-navigation
  iframe.style.display = 'none';
  container.appendChild(iframe);

  const channelId = `chan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let completed = false;

  // Determine our allowed origin for message validation
  const allowedOrigin = window.location.origin;

  const watchdogMs = 5000;
  const timeoutId = setTimeout(() => {
    if (completed) return;
    try {
      // Attempt to reload/cleanup iframe on hang without probing its document
      iframe.removeAttribute('srcdoc');
      iframe.src = 'about:blank';
    } catch {}
    if (typeof onTimeout === 'function') onTimeout();
  }, watchdogMs);

  const messageHandler = (event) => {
    try {
      // Only accept messages from our iframe, and from same-origin
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
      if (event.origin && event.origin !== 'null' && event.origin !== allowedOrigin) {
        // Ignore cross-origin events (origin 'null' occurs for sandboxed about:blank/srcdoc)
        return;
      }

      const data = event.data;
      if (!data || data.channelId !== channelId) return;

      if (data.type === 'console') {
        if (typeof onMessage === 'function') {
          onMessage({ type: data.level, text: data.payload, time: new Date().toISOString() });
        }
      } else if (data.type === 'status' && data.payload === 'completed') {
        completed = true;
        clearTimeout(timeoutId);
        if (typeof onComplete === 'function') onComplete();
      } else if (data.type === 'error') {
        if (typeof onMessage === 'function') {
          onMessage({ type: 'error', text: data.payload, time: new Date().toISOString() });
        }
      }
    } catch (err) {
      if (typeof onError === 'function') onError(err);
    }
  };

  window.addEventListener('message', messageHandler);

  // Build iframe HTML (same-frame only; no parent.document access inside)
  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Sandbox</title>
  </head>
  <body>
    <script>
${iframeCaptureScript}
      try {
        const __channelId = ${JSON.stringify(channelId)};
        // post to parent safely without touching parent.document
        const __safePost = (msg) => {
          try { window.parent && window.parent.postMessage({ ...msg, channelId: __channelId }, '*'); } catch(e) {}
        };

        // Install capture hooks
        (function(){
          try {
            const cap = createConsoleCapture(__channelId);
            cap.install();
          } catch (e) {
            try { __safePost({ type: 'error', payload: String(e && e.message ? e.message : e) }); } catch (_) {}
          }
        })();

        // Execute user code
        (async function(){
          try {
            ${code}
          } catch (e) {
            __safePost({ type: 'error', payload: String(e && e.message ? e.message : e) });
          } finally {
            __safePost({ type: 'status', payload: 'completed' });
          }
        })();
      } catch (err) {
        try {
          window.parent && window.parent.postMessage({ type: 'error', payload: String(err && err.message ? err.message : err), channelId: ${JSON.stringify(channelId)} }, '*');
        } catch(e) {}
      }
    </script>
  </body>
</html>
  `.trim();

  // Safely write content into iframe:
  // Prefer srcdoc which avoids directly touching contentDocument of a sandboxed frame.
  let wrote = false;
  try {
    if ('srcdoc' in iframe) {
      iframe.srcdoc = html;
      wrote = true;
    }
  } catch {
    // ignore and fallback to doc.write
  }

  if (!wrote) {
    try {
      // Feature-detect accessible document; avoid cross-origin violations
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc) throw new Error('Sandbox document not accessible');
      doc.open();
      doc.write(html);
      doc.close();
    } catch (err) {
      clearTimeout(timeoutId);
      window.removeEventListener('message', messageHandler);
      if (typeof onError === 'function') onError(err);
      // Best-effort cleanup
      try { if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch {}
      return { cleanup: () => {} };
    }
  }

  const cleanup = () => {
    clearTimeout(timeoutId);
    window.removeEventListener('message', messageHandler);
    try {
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    } catch {}
  };

  return { cleanup };
}

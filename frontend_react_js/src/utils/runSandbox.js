import { iframeCaptureScript } from './captureConsole';

/**
 * PUBLIC_INTERFACE
 * runInSandbox
 * Creates a fresh sandboxed iframe and executes provided JS code within it.
 * - Sandbox: allow-scripts only
 * - Communication via postMessage
 * - Watchdog: 5s timeout triggers onTimeout and reloads iframe
 * - Returns cleanup function to remove iframe and listeners
 */
export function runInSandbox({ container, code, onMessage, onComplete, onTimeout, onError }) {
  if (!container) throw new Error('Sandbox container not available');
  // Clear previous iframe
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.display = 'none';
  container.appendChild(iframe);

  const origin = window.origin || '*';
  const channelId = `chan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  let completed = false;
  const watchdogMs = 5000;
  const timeoutId = setTimeout(() => {
    if (completed) return;
    try {
      // Attempt to reload/cleanup iframe on hang
      iframe.src = 'about:blank';
    } catch {}
    if (typeof onTimeout === 'function') onTimeout();
  }, watchdogMs);

  const messageHandler = (event) => {
    try {
      // Only accept messages from our iframe
      if (event.source !== iframe.contentWindow) return;
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

  // Build iframe document with capture script and user code
  const doc = iframe.contentDocument || iframe.contentWindow.document;
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
        const __parent = window.parent;
        const __safePost = (msg) => {
          try { __parent.postMessage({ ...msg, channelId: __channelId }, '*'); } catch(e) {}
        };

        // Install capture hooks
        (function(){
          const cap = createConsoleCapture(__channelId);
          cap.install();
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
          window.parent.postMessage({ type: 'error', payload: String(err && err.message ? err.message : err), channelId: ${JSON.stringify(channelId)} }, '*');
        } catch(e) {}
      }
    </script>
  </body>
</html>
  `.trim();

  try {
    doc.open();
    doc.write(html);
    doc.close();
  } catch (err) {
    clearTimeout(timeoutId);
    window.removeEventListener('message', messageHandler);
    if (typeof onError === 'function') onError(err);
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

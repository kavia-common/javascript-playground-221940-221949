import { iframeCaptureScript } from './captureConsole';

/**
 * PUBLIC_INTERFACE
 * runInSandbox
 * JS-only executor preserved for compatibility with existing flow.
 * Creates a hidden sandboxed iframe and executes provided JS code.
 */
export function runInSandbox({ container, code, onMessage, onComplete, onTimeout, onError }) {
  if (!container) throw new Error('Sandbox container not available');
  while (container.firstChild) container.removeChild(container.firstChild);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.display = 'none';
  container.appendChild(iframe);

  const channelId = `chan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let completed = false;

  const watchdogMs = 5000;
  const timeoutId = setTimeout(() => {
    if (completed) return;
    try { iframe.removeAttribute('srcdoc'); iframe.src = 'about:blank'; } catch {}
    if (typeof onTimeout === 'function') onTimeout();
  }, watchdogMs);

  const messageHandler = (event) => {
    try {
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || data.channelId !== channelId) return;

      if (data.type === 'console') {
        onMessage && onMessage({ type: data.level, text: data.payload, time: new Date().toISOString() });
      } else if (data.type === 'status' && data.payload === 'completed') {
        completed = true;
        clearTimeout(timeoutId);
        onComplete && onComplete();
      } else if (data.type === 'error') {
        onMessage && onMessage({ type: 'error', text: data.payload, time: new Date().toISOString() });
      }
    } catch (err) {
      onError && onError(err);
    }
  };

  window.addEventListener('message', messageHandler);

  const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Sandbox</title></head>
  <body>
    <script>
${iframeCaptureScript}
      try {
        const __channelId = ${JSON.stringify(channelId)};
        const __safePost = (msg) => {
          try { window.parent && window.parent.postMessage({ ...msg, channelId: __channelId }, '*'); } catch(e) {}
        };
        (function(){ try { createConsoleCapture(__channelId).install(); } catch(e) { __safePost({ type: 'error', payload: String(e && e.message ? e.message : e) }); } })();
        (async function(){
          try { ${code} } catch(e) { __safePost({ type: 'error', payload: String(e && e.message ? e.message : e) }); }
          finally { __safePost({ type: 'status', payload: 'completed' }); }
        })();
      } catch (err) {
        try { window.parent && window.parent.postMessage({ type: 'error', payload: String(err && err.message ? err.message : err), channelId: ${JSON.stringify(channelId)} }, '*'); } catch(e) {}
      }
    </script>
  </body>
</html>
  `.trim();

  let wrote = false;
  try { if ('srcdoc' in iframe) { iframe.srcdoc = html; wrote = true; } } catch {}
  if (!wrote) {
    try {
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc) throw new Error('Sandbox document not accessible');
      doc.open(); doc.write(html); doc.close();
    } catch (err) {
      clearTimeout(timeoutId);
      window.removeEventListener('message', messageHandler);
      onError && onError(err);
      try { if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch {}
      return { cleanup: () => {} };
    }
  }

  const cleanup = () => {
    clearTimeout(timeoutId);
    window.removeEventListener('message', messageHandler);
    try { if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch {}
  };
  return { cleanup };
}

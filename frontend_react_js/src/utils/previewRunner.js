import { buildSrcDoc } from './buildSrcDoc';

/**
 * PUBLIC_INTERFACE
 * runPreview
 * Creates sandboxed iframe using srcdoc to render user HTML+CSS+JS.
 * Captures console output via postMessage. Includes a 5s watchdog timeout.
 */
export function runPreview({ container, html, css, js, onMessage, onComplete, onTimeout, onError }) {
  if (!container) throw new Error('Preview container not available');
  // Clear previous iframe(s)
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const iframe = document.createElement('iframe');
  // Prefer allow-scripts; keep same-origin disabled. Using srcdoc keeps it about:blank/null origin.
  iframe.setAttribute('sandbox', 'allow-scripts'); // keep tight; no same-origin, no popups/nav
  iframe.title = 'Sandboxed Preview';
  iframe.style.width = '100%';
  iframe.style.minHeight = '320px';
  iframe.style.border = '0';
  container.appendChild(iframe);

  const channelId = `chan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  let completed = false;
  const watchdogMs = 5000;
  const timeoutId = setTimeout(() => {
    if (completed) return;
    try {
      iframe.removeAttribute('srcdoc');
      iframe.src = 'about:blank';
    } catch {}
    if (typeof onTimeout === 'function') onTimeout();
  }, watchdogMs);

  const messageHandler = (event) => {
    try {
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
      // srcdoc/ about:blank typically uses 'null' origin; don't require origin match, restrict by source check
      const data = event.data;
      if (!data || data.channelId !== channelId) return;

      if (data.type === 'console') {
        onMessage && onMessage({ type: data.level, text: data.payload, time: new Date().toISOString() });
      } else if (data.type === 'error') {
        onMessage && onMessage({ type: 'error', text: data.payload, time: new Date().toISOString() });
      } else if (data.type === 'status' && data.payload === 'completed') {
        completed = true;
        clearTimeout(timeoutId);
        onComplete && onComplete();
      }
    } catch (err) {
      onError && onError(err);
    }
  };

  window.addEventListener('message', messageHandler);

  const htmlDoc = buildSrcDoc({ html, css, js, channelId });

  // Load via srcdoc to avoid touching the document directly
  let wrote = false;
  try {
    if ('srcdoc' in iframe) {
      iframe.srcdoc = htmlDoc;
      wrote = true;
    }
  } catch {
    // ignore
  }
  if (!wrote) {
    // Fallback to document write if necessary and accessible
    try {
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc) throw new Error('Preview document not accessible');
      doc.open();
      doc.write(htmlDoc);
      doc.close();
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

  return { cleanup, iframe };
}

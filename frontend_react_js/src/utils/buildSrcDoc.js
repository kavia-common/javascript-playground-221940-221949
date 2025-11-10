import { iframeCaptureScript } from './captureConsole';

/**
 * PUBLIC_INTERFACE
 * buildSrcDoc
 * Returns a single HTML string for iframe srcdoc, combining user HTML, CSS, and JS.
 * - Applies a restrictive CSP tailored for inline scripts/styles only within the iframe.
 * - Installs console capture and error handlers that postMessage back to parent.
 * - Executes user JS in a try/catch and posts completion status.
 */
export function buildSrcDoc({ html, css, js, channelId }) {
  const safeHtml = String(html ?? '');
  const safeCss = String(css ?? '');
  const safeJs = String(js ?? '');

  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join('; ');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <title>Preview</title>
    <style>
${safeCss}
    </style>
  </head>
  <body>
${safeHtml}
    <script>
${iframeCaptureScript}
      (function(){
        const __channelId = ${JSON.stringify(channelId)};
        const __safePost = (msg) => {
          try { window.parent && window.parent.postMessage({ ...msg, channelId: __channelId }, '*'); } catch(e) {}
        };

        try {
          const cap = createConsoleCapture(__channelId);
          cap.install();
        } catch (e) {
          try { __safePost({ type: 'error', payload: String(e && e.message ? e.message : e) }); } catch (_) {}
        }

        // Execute user JS safely
        (async function(){
          try {
${safeJs}
          } catch (e) {
            __safePost({ type: 'error', payload: String(e && e.message ? e.message : e) });
          } finally {
            __safePost({ type: 'status', payload: 'completed' });
          }
        })();

      })();
    </script>
  </body>
</html>
  `.trim();
}

import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <script dangerouslySetInnerHTML={{ __html: errorCapture }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body { background-color: #0d0d1a; }
`;

const errorCapture = `
window.__errors = [];
window.onerror = function(msg, src, line, col, err) {
  window.__errors.push(msg + ' @ ' + src + ':' + line);
  showDiag();
};
window.addEventListener('unhandledrejection', function(e) {
  window.__errors.push('Promise: ' + (e.reason && e.reason.stack ? e.reason.stack : String(e.reason)));
  showDiag();
});
function showDiag() {
  var d = document.getElementById('__diag');
  if (!d) { d = document.createElement('div'); d.id = '__diag';
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#500;color:#fff;padding:8px;font:12px monospace;z-index:99999;white-space:pre-wrap;max-height:60%;overflow:auto;';
    document.body.appendChild(d); }
  d.textContent = window.__errors.join('\\n');
}
window.addEventListener('DOMContentLoaded', function() {
  var m = document.createElement('div');
  m.id = '__marker';
  m.style.cssText = 'position:fixed;bottom:4px;right:4px;background:#00f;color:#fff;padding:4px 8px;font:11px monospace;z-index:99998;border-radius:4px;';
  m.textContent = 'JS OK';
  document.body.appendChild(m);
  setTimeout(function() {
    var r = document.getElementById('root');
    if (r && r.children.length === 0) {
      m.style.background = '#f80';
      m.textContent = 'root empty after 3s';
    } else if (r) {
      m.style.background = '#080';
      m.textContent = 'root has ' + r.children.length + ' children';
    }
  }, 3000);
});
`;

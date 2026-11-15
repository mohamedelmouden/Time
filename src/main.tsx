import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import './index.css';
import App from './App';
import { Provider } from './store';

// Remove the inline loading indicator once React takes over.
const loader = document.getElementById('flame-loader');
if (loader) loader.remove();

class StartupBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return (
      <main className="min-h-screen grid place-items-center p-5 bg-bg text-tx" dir="rtl">
        <section className="card w-full max-w-md text-center space-y-3">
          <div className="text-2xl font-bold text-flame">FLAME</div>
          <h1 className="text-lg font-bold">تعذر تحميل التطبيق</h1>
          <p className="text-sm text-tx2">حدث خطأ أثناء فتح التطبيق أو استعادة بياناته. أعد المحاولة لتحديث الصفحة.</p>
          <button className="btn-p w-full" onClick={() => window.location.reload()}>إعادة المحاولة</button>
        </section>
      </main>
    );
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(<StartupBoundary><Provider><App /></Provider></StartupBoundary>);

// Recover once from a deployment that replaced a cached JavaScript chunk.
// Guard uses both sessionStorage (per-tab) and a timestamp to prevent loops
// even when the tab is discarded and restored on mobile.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const key = 'flame:preload-retry';
    const prev = sessionStorage.getItem(key);
    // If we already retried within the last 30 seconds, stop.
    if (prev && Date.now() - Number(prev) < 30_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch { return; /* avoid a reload loop if storage is unavailable */ }
  // Clear the SW cache so the reload fetches fresh assets.
  caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))).catch(() => {});
  window.location.reload();
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // Force the new SW to activate immediately if one is waiting.
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => {});
  });
}

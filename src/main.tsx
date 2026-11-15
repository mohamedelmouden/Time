import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import './index.css';
import App from './App';
import { Provider } from './store';

/** Unregister every SW and delete every cache — scorched-earth recovery. */
async function nukeSW() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((regs ?? []).map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch { /* best-effort */ }
}

function removeLoader() {
  clearTimeout(stuckTimer);
  const el = document.getElementById('flame-loader');
  if (el) el.remove();
}

class StartupBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidMount() {
    // Remove the inline loader only AFTER React has successfully mounted.
    removeLoader();
  }

  render() {
    if (this.state.hasError) {
      removeLoader();
      return (
        <main className="min-h-screen grid place-items-center p-5 bg-bg text-tx" dir="rtl">
          <section className="card w-full max-w-md text-center space-y-3">
            <div className="text-2xl font-bold text-flame">FLAME</div>
            <h1 className="text-lg font-bold">تعذر تحميل التطبيق</h1>
            <p className="text-sm text-tx2">حدث خطأ أثناء فتح التطبيق أو استعادة بياناته. أعد المحاولة لتحديث الصفحة.</p>
            <button className="btn-p w-full" onClick={() => {
              nukeSW().finally(() => window.location.reload());
            }}>إعادة المحاولة</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StartupBoundary><Provider><App /></Provider></StartupBoundary>
);

// If the app doesn't render within 6 seconds, show a recovery button
// instead of leaving a blank dark screen forever.
const stuckTimer = setTimeout(() => {
  const loader = document.getElementById('flame-loader');
  if (!loader) return; // App rendered fine
  loader.innerHTML = `
    <div style="text-align:center;max-width:320px;padding:0 20px">
      <div style="font-size:28px;font-weight:700;color:#F5F5F5;margin-bottom:18px">
        <span style="color:#FF8A32">🔥</span> FLAME
      </div>
      <p style="color:#9298A5;font-size:14px;margin-bottom:18px;line-height:1.6">
        تعذر تحميل التطبيق. جرّب مسح الكاش وإعادة المحاولة.
      </p>
      <button onclick="
        navigator.serviceWorker&&navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});
        caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})});
        sessionStorage.clear();
        setTimeout(function(){location.reload()},400);
      " style="
        width:100%;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:700;
        background:linear-gradient(135deg,#FF8A32,#FFC15A);color:#0B0D12;cursor:pointer;
        font-family:'Tajawal',system-ui,sans-serif;
      ">مسح الكاش وإعادة المحاولة</button>
    </div>`;
}, 6000);

// Recover once from a deployment that replaced a cached JavaScript chunk.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const key = 'flame:preload-retry';
    const prev = sessionStorage.getItem(key);
    if (prev && Date.now() - Number(prev) < 30_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch { return; }
  nukeSW().finally(() => window.location.reload());
});

// Service Worker registration is disabled.
// The inline <script> in index.html unregisters any leftover SW from older
// deployments so the app always loads fresh assets from Vercel's CDN.
// Re-enable only after confirming the app loads reliably on all devices:
//
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('./sw.js').catch(() => {});
//   });
// }

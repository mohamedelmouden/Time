import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import './index.css';
import App from './App';
import { Provider } from './store';

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

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

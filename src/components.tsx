import { tr } from './i18n';
import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { deadline, fmtLeft, ringProgress } from './logic';
import type { Category, ImportantEvent, Priority } from './types';

const mk = <K extends string>(o: Record<K, string>) => { const r = {} as Record<K, string>; for (const k in o) Object.defineProperty(r, k, { enumerable: true, get: () => tr(o[k]) }); return r; };
export const CAT = mk<Category>({ exam: 'امتحان', deadline: 'موعد نهائي', competition: 'مسابقة', appointment: 'موعد', personal: 'شخصي', other: 'أخرى' });
export const PRIO = mk<Priority>({ normal: 'عادية', important: 'مهم', critical: 'حرجة' });

export const useNow = (ms = 1000) => {
  const [n, set] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => set(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return n;
};

/** Flame grows with the streak: dim (0) → golden (30+). */
export function Flame({ days }: { days: number }) {
  const lv = days === 0 ? 0 : days <= 3 ? 1 : days <= 7 ? 2 : days <= 14 ? 3 : days <= 30 ? 4 : 5;
  const sc = [0.55, 0.72, 0.85, 1, 1.12, 1.25][lv];
  const gold = lv === 5;
  return (
    <div className="h-36 grid place-items-center">
      <motion.svg viewBox="0 0 100 110" className="w-32 h-32" style={{ opacity: lv === 0 ? 0.5 : 1, filter: `drop-shadow(0 0 ${6 + lv * 5}px ${gold ? '#FFC15A' : '#FF8A32'}aa)` }}
        animate={{ scale: [sc, sc * 1.05, sc], y: [0, -2, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        <defs>
          <linearGradient id="fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={gold ? '#FF8A32' : '#E8501E'} /><stop offset="1" stopColor={gold ? '#FFC15A' : '#FF8A32'} /></linearGradient>
          <linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFC15A" /><stop offset="1" stopColor="#FFE9A8" /></linearGradient>
        </defs>
        <path d="M50 4C60 24 86 40 86 68c0 20-16 34-36 34S14 88 14 68c0-18 14-26 19-40 5 10 9 12 11 12-2-15 1-26 6-36z" fill="url(#fo)" />
        <path d="M50 52c8 14 24 22 24 38 0 12-10 18-24 18S26 102 26 90c0-12 9-17 12-27 4 6 8 8 12 8z" fill="url(#fi)" />
      </motion.svg>
    </div>
  );
}

/** SVG countdown ring: progress = elapsed / total duration since creation. */
export function Ring({ ev, big }: { ev: ImportantEvent; big?: boolean }) {
  const now = useNow(1000);
  const left = deadline(ev).getTime() - now;
  const p = ev.status === 'completed' ? 1 : ringProgress(ev, now);
  const R = 52, C = 2 * Math.PI * R;
  const crit = left > 0 && left < 36e5;
  const { n, unit } = fmtLeft(left);
  const g = `rg${ev.id}`;
  return (
    <div className={`relative mx-auto ${big ? 'w-52' : 'w-24'}`} style={{ filter: `drop-shadow(0 0 ${big ? 10 : 5}px ${crit ? '#EF646466' : '#FF8A3255'})` }}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={crit ? '#EF6464' : '#FF8A32'} /><stop offset="1" stopColor={crit ? '#FF8A32' : '#FFC15A'} /></linearGradient></defs>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(var(--track))" strokeWidth="9" />
        <motion.circle cx="60" cy="60" r={R} fill="none" stroke={`url(#${g})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - p) }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center leading-tight" dir="ltr">
        <div className={`font-bold tabular-nums ${big ? (n.includes(':') ? 'text-3xl' : 'text-5xl') : n.includes(':') ? 'text-xs' : 'text-2xl'}`}>{n}</div>
        <div className={`text-tx2 ${big ? 'text-sm' : 'text-[10px]'}`} dir="rtl">{unit}</div>
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">{title}</h2><button className="icon-b" onClick={onClose} aria-label={tr('إغلاق')}><X size={20} /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

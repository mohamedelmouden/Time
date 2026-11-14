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
  return (
    <div className="h-36 grid place-items-center">
      <motion.svg viewBox="0 0 100 120" className="flame-art w-28 h-28 sm:w-32 sm:h-32" style={{ filter: 'drop-shadow(0 0 12px rgb(233 91 27 / .4))' }}
        animate={{ scale: [sc, sc * 1.025, sc * 0.99, sc], y: [0, -1, 0.5, 0] }} transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}>
        <defs>
          <radialGradient id="fireGlow"><stop stopColor="#FF9A32" stopOpacity=".45" /><stop offset="1" stopColor="#F05B22" stopOpacity="0" /></radialGradient>
          <linearGradient id="fireOuter" x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#F26453" /><stop offset=".48" stopColor="#F05A20" /><stop offset="1" stopColor="#F28C18" /></linearGradient>
          <linearGradient id="fireInner" x1=".5" y1=".18" x2=".5" y2="1"><stop stopColor="#FFF17A" /><stop offset=".58" stopColor="#FFF7AD" /><stop offset="1" stopColor="#FFE28A" /></linearGradient>
          <filter id="fireBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <ellipse cx="50" cy="83" rx="36" ry="30" fill="url(#fireGlow)" filter="url(#fireBlur)" />
        <motion.path d="M49 5c8 8 17 18 21 31 3 10 2 20-1 27 8 3 14-1 17-8 2-4 3-8 4-11 8 11 12 25 10 39-3 23-22 36-50 36-27 0-45-13-49-34-3-16 2-32 11-45 3-5 7-8 10-10-2 12-1 22 3 29 3-8 6-16 11-23 7-10 13-18 13-31 0-8-2-13-4-18 1 0 2 1 4 2z" fill="url(#fireOuter)"
          animate={{ scaleX: [1, 1.018, 0.99, 1], scaleY: [1, 1.025, 0.99, 1], originX: '50%', originY: '100%', rotate: [0, 0.5, -0.5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.path d="M53 43c-5 9-12 17-16 27-2 5-2 10 1 14-5-2-9-6-12-12-4 8-4 15-1 22 4 10 14 16 26 16 14 0 25-7 28-18 2-9-1-16-7-25-6-9-11-17-10-27 0-5 1-9 4-14-6 3-10 8-13 15z" fill="url(#fireInner)"
          animate={{ scaleX: [1, 0.985, 1.02, 1], scaleY: [0.97, 1.045, 0.99, 0.97], originX: '50%', originY: '100%', opacity: [0.94, 1, 0.96, 0.94] }} transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.circle cx="29" cy="58" r="1.3" fill="#FFD17A" animate={{ y: [0, -6], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />
        <motion.circle cx="75" cy="48" r="1.2" fill="#FFE5A3" animate={{ y: [0, -7], opacity: [0.7, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: 'easeOut' }} />
      </motion.svg>
    </div>
  );
}

/** Countdown ring: its colored arc represents the time still remaining. */
export function Ring({ ev, big }: { ev: ImportantEvent; big?: boolean }) {
  const now = useNow(1000);
  const left = deadline(ev).getTime() - now;
  const p = ev.status === 'completed' ? 1 : Math.max(0, 1 - ringProgress(ev, now));
  const R = 52, C = 2 * Math.PI * R;
  const crit = left > 0 && left < 36e5;
  const { n: time, unit: timeUnit } = fmtLeft(left);
  const n = ev.status === 'completed' ? '✓' : time;
  const unit = ev.status === 'completed' ? tr('اكتمل') : timeUnit;
  const totalSeconds = Math.max(0, Math.floor(left / 1000));
  const secondsInDay = totalSeconds % 86400;
  const pad = (value: number) => String(value).padStart(2, '0');
  const preciseClock = left >= 864e5 && ev.status === 'upcoming'
    ? `${pad(Math.floor(secondsInDay / 3600))}:${pad(Math.floor((secondsInDay % 3600) / 60))}:${pad(secondsInDay % 60)}`
    : null;
  const g = `rg${ev.id}`;
  return (
    <div className={`relative mx-auto ${big ? 'w-52' : 'w-24'}`} style={{ filter: `drop-shadow(0 0 ${big ? 12 : 6}px ${crit ? 'rgb(239 100 100 / .33)' : 'rgb(var(--flame) / .27)'})` }}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={crit ? '#EF6464' : 'rgb(var(--flame))'} /><stop offset=".55" stopColor={crit ? '#FF8A32' : 'rgb(var(--gold))'} /><stop offset="1" stopColor={crit ? '#FFC15A' : 'color-mix(in srgb, rgb(var(--gold)) 60%, white)'} /></linearGradient></defs>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(var(--track))" strokeWidth={big ? 8 : 7} />
        <circle cx="60" cy="60" r="43" fill="none" stroke="rgb(var(--line))" strokeWidth=".7" opacity=".12" />
        <motion.circle cx="60" cy="60" r={R} fill="none" stroke={`url(#${g})`} strokeWidth={big ? 8 : 7} strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C * (1 - p) }} animate={{ strokeDashoffset: C * (1 - p) }} transition={{ duration: 0.9, ease: 'linear' }} />
      </svg>
      <div className="absolute inset-[18%] rounded-full border border-line/5 bg-gradient-to-br from-bg2/65 to-bg/35 shadow-inner grid content-center text-center leading-tight" dir="ltr">
        <div className={`font-bold tabular-nums ${big ? (n.includes(':') ? 'text-3xl' : 'text-5xl') : n.includes(':') ? 'text-xs' : 'text-2xl'}`}>{n}</div>
        <div className={`text-tx2 ${big ? 'text-sm' : 'text-[10px]'}`} dir="rtl">{unit}</div>
        {preciseClock && <div className={`mt-0.5 font-semibold tracking-wider text-gold/90 tabular-nums ${big ? 'text-xs' : 'text-[9px]'}`} dir="ltr">{preciseClock}</div>}
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

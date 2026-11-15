import { tr } from './i18n';
import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  const reduceMotion = useReducedMotion();
  const lv = days === 0 ? 0 : days <= 3 ? 1 : days <= 7 ? 2 : days <= 14 ? 3 : days <= 30 ? 4 : 5;
  const sc = [0.55, 0.72, 0.85, 1, 1.12, 1.25][lv];
  return (
    <div className="h-36 grid place-items-center">
      <motion.svg viewBox="0 0 120 140" className="flame-art w-28 h-28 sm:w-32 sm:h-32" aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 11px rgb(244 75 17 / .28))' }}
        animate={reduceMotion ? { scale: sc } : { scale: [sc, sc * 1.012, sc * 0.992, sc * 1.008, sc], y: [0, -0.6, 0.5, -0.25, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        <defs>
          <radialGradient id="fireGlow" cx="50%" cy="76%" r="56%"><stop stopColor="#FFB629" stopOpacity=".72" /><stop offset=".38" stopColor="#FF5B12" stopOpacity=".28" /><stop offset="1" stopColor="#E92D10" stopOpacity="0" /></radialGradient>
          <linearGradient id="fireOuter" x1=".18" y1=".05" x2=".82" y2=".96"><stop stopColor="#FFE75A" /><stop offset=".2" stopColor="#FF9D19" /><stop offset=".57" stopColor="#F44913" /><stop offset=".82" stopColor="#E82B13" /><stop offset="1" stopColor="#FF8C16" /></linearGradient>
          <linearGradient id="fireTongue" x1=".28" y1=".08" x2=".72" y2=".98"><stop stopColor="#FFF36B" /><stop offset=".38" stopColor="#FFC42D" /><stop offset=".76" stopColor="#FF6718" /><stop offset="1" stopColor="#F53B12" /></linearGradient>
          <radialGradient id="fireCore" cx="50%" cy="70%" r="65%"><stop stopColor="#FFFCE0" /><stop offset=".38" stopColor="#FFF080" /><stop offset=".76" stopColor="#FFC52B" /><stop offset="1" stopColor="#FF8A18" /></radialGradient>
        </defs>
        <motion.ellipse cx="60" cy="106" rx="43" ry="27" fill="url(#fireGlow)"
          animate={reduceMotion ? { opacity: 0.62 } : { opacity: [0.42, 0.68, 0.5, 0.76, 0.42], scaleX: [0.92, 1.04, 0.96, 1.02, 0.92] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }} />

        <motion.path d="M61 7C54 21 59 35 68 48c6 9 12 15 13 24 5-5 5-13 2-21 13 15 20 31 17 48-3 21-19 35-40 35-22 0-38-15-40-36-2-17 7-31 19-44 0 11 3 19 8 25 2-15 11-25 16-38 5-12 3-24-2-34z" fill="url(#fireOuter)"
          animate={reduceMotion ? {} : { scaleX: [1, 1.025, 0.985, 1.018, 1], scaleY: [0.96, 1.035, 0.985, 1.02, 0.96], rotate: [0, 0.8, -0.7, 0.4, 0], originX: '50%', originY: '100%' }}
          transition={{ duration: 1.65, repeat: Infinity, ease: 'easeInOut' }} />

        <motion.path d="M60 126c-17-2-28-14-27-29 1-9 6-17 13-25-1 11 5 16 10 22 4-8 5-15 3-23 10 12 15 21 13 33-1 10-6 18-12 22z" fill="url(#fireTongue)"
          animate={reduceMotion ? {} : { scaleX: [0.96, 1.04, 0.98, 1.02, 0.96], scaleY: [0.94, 1.08, 0.98, 1.04, 0.94], rotate: [0, -1.2, 0.8, -0.5, 0], originX: '50%', originY: '100%' }}
          transition={{ duration: 1.18, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }} />

        <motion.path d="M61 119c-10-8-11-17-5-27 4-6 7-12 7-20 9 10 15 18 14 29-1 9-7 16-16 18z" fill="url(#fireCore)"
          animate={reduceMotion ? {} : { scaleX: [1, 0.9, 1.06, 0.96, 1], scaleY: [0.96, 1.1, 0.94, 1.04, 0.96], opacity: [0.88, 1, 0.92, 1, 0.88], originX: '50%', originY: '100%' }}
          transition={{ duration: 0.92, repeat: Infinity, ease: 'easeInOut', delay: 0.28 }} />

        {[
          { x: 39, y: 77, delay: 0.1, rise: -18 },
          { x: 77, y: 68, delay: 0.72, rise: -22 },
          { x: 53, y: 53, delay: 1.1, rise: -16 },
          { x: 68, y: 88, delay: 1.55, rise: -20 },
        ].map((spark, i) => <motion.circle key={i} cx={spark.x} cy={spark.y} r={i % 2 ? 1.1 : 1.4} fill={i % 2 ? '#FFE9A1' : '#FFF5C5'}
          animate={reduceMotion ? { opacity: 0 } : { x: [0, i % 2 ? 2.5 : -2, i % 2 ? -1 : 1], y: [0, spark.rise * 0.55, spark.rise], opacity: [0, 0.95, 0] }}
          transition={{ duration: 1.45 + (i % 2) * 0.35, repeat: Infinity, ease: 'easeOut', delay: spark.delay }} />)}
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

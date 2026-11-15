import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import type { AccentColor, AppData, Category, DailyMission, ImportantEvent, Priority, Theme } from './types';
import { empty, load, normalize, save } from './storage';
import { applyLang } from './i18n';
import { DK, effDay, markableDay, sync, todayKey, uid } from './logic';

export interface Draft { id?: string; title: string; description?: string; completed?: boolean }
export interface EventInput { title: string; description?: string; eventDate: string; eventTime?: string; category: Category; priority: Priority }

function useStore() {
  const [data, setData] = useState<AppData>(() => sync(load(), todayKey()));
  const [today, setToday] = useState(todayKey());
  const [eff, setEff] = useState(effDay());
  const ref = useRef(data);
  ref.current = data;
  // Apply language in an effect — not during render — to avoid DOM mutations
  // that can trigger layout thrash on mobile browsers.
  useEffect(() => { applyLang(data.settings.lang); }, [data.settings.lang]);
  useEffect(() => { save(data); }, [data]);
  useEffect(() => {
    const run = () => { const t = todayKey(); setToday(t); setEff(effDay()); setData((d) => sync(d, t)); };
    const i = setInterval(run, 30000);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('focus', run);
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', run); window.removeEventListener('focus', run); };
  }, []);
  const up = (fn: (d: AppData, t: string) => AppData) => setData((d) => { const t = todayKey(); return sync(fn(d, t), t); });
  const clean = (ts: Draft[]) => ts.filter((t) => t.title.trim()).map((t) => ({ id: t.id ?? uid(), title: t.title.trim(), description: t.description?.trim() || undefined, completed: !!t.completed }));

  return {
    data, today, eff,
    /** Only today can be validated; a second call corrects the record (UI asks for confirmation). */
    validate: (status: 'success' | 'failure') => up((d) => {
      const day = markableDay(); // enforced here: only 22:00 → 08:00
      if (!day) return d;
      return { ...d, disciplineRecords: [...d.disciplineRecords.filter((r) => r.date !== day), { date: day, status }].sort((a, b) => a.date.localeCompare(b.date)) };
    }),
    addExpense: (date: string, description: string, amount: number) => up((d, t) => {
      const label = description.trim();
      const rounded = Math.round(amount * 100) / 100;
      if (!label || date > t || !Number.isFinite(amount) || rounded <= 0) return d;
      return { ...d, expenseEntries: [...d.expenseEntries, { id: uid(), date, description: label, amount: rounded }] };
    }),
    updateExpense: (id: string, description: string, amount: number) => up((d, t) => {
      const label = description.trim();
      const rounded = Math.round(amount * 100) / 100;
      if (!label || !Number.isFinite(amount) || rounded <= 0) return d;
      return { ...d, expenseEntries: d.expenseEntries.map((e) => e.id === id && e.date <= t ? { ...e, description: label, amount: rounded } : e) };
    }),
    deleteExpense: (id: string) => up((d) => ({ ...d, expenseEntries: d.expenseEntries.filter((e) => e.id !== id) })),
    addMission: (date: string, tasks: Draft[]) => up((d, t) => {
      if (date <= t) return d;
      const ts = clean(tasks); if (!ts.length) return d;
      const ex = d.dailyMissions.find((m) => m.scheduledDate === date && m.status === 'upcoming');
      if (ex) return { ...d, dailyMissions: d.dailyMissions.map((m) => (m === ex ? { ...m, tasks: [...m.tasks, ...ts] } : m)) };
      return { ...d, dailyMissions: [...d.dailyMissions, { id: uid(), scheduledDate: date, tasks: ts, status: 'upcoming', createdAt: new Date().toISOString() }] };
    }),
    addTodayTask: (title: string, description?: string) => up((d, t) => {
      const label = title.trim();
      if (!label) return d;
      const task = { id: uid(), title: label, description: description?.trim() || undefined, completed: true };
      const mission = d.dailyMissions.find((m) => m.scheduledDate === t);
      if (mission) return { ...d, dailyMissions: d.dailyMissions.map((m) => m.id === mission.id ? { ...m, status: 'active', tasks: [...m.tasks, task] } : m) };
      return { ...d, dailyMissions: [...d.dailyMissions, { id: uid(), scheduledDate: t, tasks: [task], status: 'active', createdAt: new Date().toISOString() }] };
    }),
    /** Locked missions (today or past) are rejected here, in the data layer. */
    updateMission: (id: string, date: string, tasks: Draft[]) => up((d, t) => {
      const m = d.dailyMissions.find((x) => x.id === id);
      if (!m || m.status !== 'upcoming' || m.scheduledDate <= t || date <= t) return d;
      const ts = clean(tasks); if (!ts.length) return d;
      const other = d.dailyMissions.find((x) => x.id !== id && x.scheduledDate === date && x.status === 'upcoming');
      if (other) return { ...d, dailyMissions: d.dailyMissions.filter((x) => x.id !== id).map((x) => (x === other ? { ...x, tasks: [...x.tasks, ...ts] } : x)) };
      return { ...d, dailyMissions: d.dailyMissions.map((x) => (x.id === id ? { ...x, scheduledDate: date, tasks: ts } : x)) };
    }),
    deleteMission: (id: string) => up((d, t) => ({ ...d, dailyMissions: d.dailyMissions.filter((m) => m.id !== id || m.status !== 'upcoming' || m.scheduledDate <= t) })),
    /** Execution-only: checking is allowed on the scheduled day alone. */
    toggleTask: (mid: string, tid: string) => up((d, t) => ({ ...d, dailyMissions: d.dailyMissions.map((m) => (m.id === mid && m.scheduledDate === t ? { ...m, tasks: m.tasks.map((k) => (k.id === tid ? { ...k, completed: !k.completed } : k)) } : m)) })),
    addEvent: (e: EventInput) => up((d) => ({ ...d, importantEvents: [...d.importantEvents, { ...e, title: e.title.trim(), id: uid(), status: 'upcoming', createdAt: new Date().toISOString() }] })),
    updateEvent: (id: string, e: EventInput) => up((d) => ({ ...d, importantEvents: d.importantEvents.map((x) => (x.id === id && x.status === 'upcoming' ? { ...x, ...e, title: e.title.trim() } : x)) })),
    deleteEvent: (id: string) => up((d) => ({ ...d, importantEvents: d.importantEvents.filter((x) => x.id !== id) })),
    completeEvent: (id: string) => up((d) => ({ ...d, importantEvents: d.importantEvents.map((x) => (x.id === id && x.status === 'upcoming' ? { ...x, status: 'completed' as const, completedAt: new Date().toISOString() } : x)) })),
    setTheme: (theme: Theme) => up((d) => ({ ...d, settings: { ...d.settings, theme } })),
    setAccentColor: (accentColor: AccentColor) => up((d) => ({ ...d, settings: { ...d.settings, accentColor } })),
    importJson: (text: string) => { try { const n = normalize(JSON.parse(text)); if (!n) return false; setData(sync(n, todayKey())); return true; } catch { return false; } },
    setLang: (lang: 'ar' | 'fr') => up((d) => ({ ...d, settings: { ...d.settings, lang } })),
    reset: () => setData((d) => ({ ...empty(), settings: { ...d.settings, startDate: todayKey() } })),
    exportJson: () => JSON.stringify(ref.current, null, 2),
    tomorrow: () => format(addDays(parseISO(todayKey()), 1), DK),
  };
}
const Ctx = createContext<ReturnType<typeof useStore> | null>(null);
export const Provider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={useStore()}>{children}</Ctx.Provider>;
export const useApp = () => useContext(Ctx)!;
export type { DailyMission, ImportantEvent };

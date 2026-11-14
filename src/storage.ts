import { format, isValid, parseISO, subYears } from 'date-fns';
import type { AppData } from './types';
const KEY = 'flame:data';
export const VERSION = 1;
export const empty = (): AppData => ({ version: VERSION, disciplineRecords: [], expenseEntries: [], dailyMissions: [], importantEvents: [], settings: { theme: 'dark', accentColor: 'orange', lang: 'ar', startDate: format(new Date(), 'yyyy-MM-dd') } });
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (value: unknown): value is string => typeof value === 'string' && DATE.test(value) && isValid(parseISO(value));
const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);

/** Validates/migrates unknown JSON into AppData. Returns null when unusable. Removes duplicates. */
export function normalize(raw: any): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = empty();
  const recs = new Map<string, AppData['disciplineRecords'][number]>();
  for (const r of arr(raw.disciplineRecords)) if (r && isDate(r.date) && (r.status === 'success' || r.status === 'failure')) recs.set(r.date, { date: r.date, status: r.status, ...(r.auto ? { auto: true } : {}) });
  d.disciplineRecords = [...recs.values()].sort((a, b) => a.date.localeCompare(b.date));
  const expenses = new Map<string, AppData['expenseEntries'][number]>();
  for (const e of arr(raw.expenseEntries)) if (e && typeof e.id === 'string' && isDate(e.date) && typeof e.description === 'string' && e.description.trim() && typeof e.amount === 'number' && Number.isFinite(e.amount) && e.amount > 0) {
    const amount = Math.round(e.amount * 100) / 100;
    if (amount > 0) expenses.set(e.id, { id: e.id, date: e.date, description: e.description.trim(), amount });
  }
  d.expenseEntries = [...expenses.values()].sort((a, b) => a.date.localeCompare(b.date));
  const ms = new Map<string, any>();
  for (const m of arr(raw.dailyMissions)) if (m && typeof m.id === 'string' && isDate(m.scheduledDate) && Array.isArray(m.tasks)) {
    ms.set(m.id, { ...m, tasks: m.tasks.filter((t: any) => t && typeof t.id === 'string' && typeof t.title === 'string').map((t: any) => ({ id: t.id, title: t.title.trim(), description: typeof t.description === 'string' ? t.description.trim() || undefined : undefined, completed: !!t.completed })), createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString() });
  }
  d.dailyMissions = [...ms.values()];
  const es = new Map<string, any>();
  const categories = ['exam', 'deadline', 'competition', 'appointment', 'personal', 'other'];
  const priorities = ['normal', 'important', 'critical'];
  const statuses = ['upcoming', 'completed', 'expired'];
  for (const e of arr(raw.importantEvents)) if (e && typeof e.id === 'string' && typeof e.title === 'string' && e.title.trim() && isDate(e.eventDate)) {
    const eventTime = typeof e.eventTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(e.eventTime) ? e.eventTime : undefined;
    es.set(e.id, {
      id: e.id, title: e.title.trim(), description: typeof e.description === 'string' ? e.description.trim() || undefined : undefined,
      eventDate: e.eventDate, ...(eventTime ? { eventTime } : {}),
      category: categories.includes(e.category) ? e.category : 'other', priority: priorities.includes(e.priority) ? e.priority : 'normal',
      status: statuses.includes(e.status) ? e.status : 'upcoming', createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
      ...(typeof e.completedAt === 'string' ? { completedAt: e.completedAt } : {}),
    });
  }
  d.importantEvents = [...es.values()];
  const th = raw.settings?.theme;
  if (th === 'dark' || th === 'light' || th === 'system') d.settings.theme = th;
  const ac = raw.settings?.accentColor;
  if (['orange', 'yellow', 'pink', 'red', 'blue', 'purple', 'green', 'cyan'].includes(ac)) d.settings.accentColor = ac;
  const sd = raw.settings?.startDate;
  const earliestStart = format(subYears(new Date(), 100), 'yyyy-MM-dd');
  const savedStart = isDate(sd) ? sd : d.disciplineRecords[0]?.date ?? d.settings.startDate;
  d.settings.startDate = savedStart < earliestStart ? earliestStart : savedStart;
  const lg = raw.settings?.lang;
  if (lg === 'ar' || lg === 'fr') d.settings.lang = lg;
  return d;
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    try { return normalize(JSON.parse(raw)) ?? empty(); }
    catch {
      try { localStorage.setItem(KEY + ':corrupt', raw); } catch { /* storage may be unavailable or full */ }
      return empty();
    }
  } catch { return empty(); }
}
export const save = (d: AppData) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ } };

import { format } from 'date-fns';
import type { AppData } from './types';
const KEY = 'flame:data';
export const VERSION = 1;
export const empty = (): AppData => ({ version: VERSION, disciplineRecords: [], dailyMissions: [], importantEvents: [], settings: { theme: 'dark', lang: 'ar', startDate: format(new Date(), 'yyyy-MM-dd') } });
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);

/** Validates/migrates unknown JSON into AppData. Returns null when unusable. Removes duplicates. */
export function normalize(raw: any): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = empty();
  const recs = new Map<string, AppData['disciplineRecords'][number]>();
  for (const r of arr(raw.disciplineRecords)) if (r && DATE.test(r.date) && (r.status === 'success' || r.status === 'failure')) recs.set(r.date, { date: r.date, status: r.status, ...(r.auto ? { auto: true } : {}) });
  d.disciplineRecords = [...recs.values()].sort((a, b) => a.date.localeCompare(b.date));
  const ms = new Map<string, any>();
  for (const m of arr(raw.dailyMissions)) if (m && m.id && DATE.test(m.scheduledDate) && Array.isArray(m.tasks)) {
    ms.set(m.id, { ...m, tasks: m.tasks.filter((t: any) => t && t.id && typeof t.title === 'string').map((t: any) => ({ ...t, completed: !!t.completed })), createdAt: m.createdAt || new Date().toISOString() });
  }
  d.dailyMissions = [...ms.values()];
  const es = new Map<string, any>();
  for (const e of arr(raw.importantEvents)) if (e && e.id && e.title && DATE.test(e.eventDate)) es.set(e.id, { category: 'other', priority: 'normal', status: 'upcoming', createdAt: new Date().toISOString(), ...e });
  d.importantEvents = [...es.values()];
  const th = raw.settings?.theme;
  if (th === 'dark' || th === 'light' || th === 'system') d.settings.theme = th;
  const sd = raw.settings?.startDate;
  d.settings.startDate = typeof sd === 'string' && DATE.test(sd) ? sd : d.disciplineRecords[0]?.date ?? d.settings.startDate;
  const lg = raw.settings?.lang;
  if (lg === 'ar' || lg === 'fr') d.settings.lang = lg;
  return d;
}

export function load(): AppData {
  const raw = localStorage.getItem(KEY);
  if (!raw) return empty();
  try { return normalize(JSON.parse(raw)) ?? empty(); }
  catch { localStorage.setItem(KEY + ':corrupt', raw); return empty(); }
}
export const save = (d: AppData) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ } };

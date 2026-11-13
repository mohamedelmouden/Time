import { tr } from './i18n';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { AppData, ImportantEvent } from './types';

export const DK = 'yyyy-MM-dd';
export const todayKey = () => format(new Date(), DK);
export const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const MARK_START_HOUR = 22;
const AUTO_LOSS_HOUR = 8;
/** Before 08:00, yesterday is still open; at 08:00 it is closed. */
export const effDay = (now = Date.now()) => {
  const date = new Date(now);
  return format(date.getHours() < AUTO_LOSS_HOUR ? addDays(date, -1) : date, DK);
};
/** The day that can be validated right now: only between 22:00 and 08:00 (next morning). Otherwise null. */
export function markableDay(now = new Date()) {
  const h = now.getHours();
  return h >= MARK_START_HOUR ? format(now, DK) : h < AUTO_LOSS_HOUR ? format(addDays(now, -1), DK) : null;
}
export const PTS = { win: 10, lose: -10, allDone: 20 };

/** Streaks come from real calendar dates: a gap or failure breaks the streak. */
export function streaks(recs: AppData['disciplineRecords'], today: string) {
  const ok = new Set(recs.filter((r) => r.status === 'success').map((r) => r.date));
  const lostToday = recs.some((r) => r.date === today && r.status === 'failure');
  let cur = 0;
  if (!lostToday) {
    let d = ok.has(today) ? today : format(addDays(parseISO(today), -1), DK);
    while (ok.has(d)) { cur++; d = format(addDays(parseISO(d), -1), DK); }
  }
  let best = 0, run = 0, prev = '';
  for (const s of [...ok].sort()) { run = prev && differenceInCalendarDays(parseISO(s), parseISO(prev)) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = s; }
  return { cur, best };
}

/** Points are derived from the data, so they can never be duplicated or drift. */
export function points(d: AppData) {
  let p = 0;
  for (const r of d.disciplineRecords) p += r.status === 'success' ? PTS.win : PTS.lose;
  for (const m of d.dailyMissions) if (m.status !== 'upcoming' && m.tasks.length && m.tasks.every((t) => t.completed)) p += PTS.allDone;
  return Math.max(0, p);
}

export const deadline = (e: ImportantEvent) => {
  const t = e.eventTime ? (e.eventTime.length === 5 ? e.eventTime + ':00' : e.eventTime) : '23:59:59';
  return new Date(`${e.eventDate}T${t}`);
};

/** Archives expired missions, activates today's, and expires overdue events. Returns the same object if nothing changed. */
export function sync(d: AppData, today: string, now = Date.now()): AppData {
  let ch = false;
  const dailyMissions = d.dailyMissions.map((m) => {
    if (m.status === 'archived') return m;
    const s = m.scheduledDate < today ? 'archived' : m.scheduledDate === today ? 'active' : 'upcoming';
    if (s === m.status) return m;
    ch = true;
    return { ...m, status: s as typeof m.status, archivedAt: s === 'archived' ? new Date().toISOString() : undefined };
  });
  // A day not validated by 08:00 the next morning is lost automatically.
  let disciplineRecords = d.disciplineRecords;
  const eff = effDay(now), have = new Set(disciplineRecords.map((r) => r.date)), add: AppData['disciplineRecords'] = [];
  for (let x = d.settings.startDate; x < eff; x = format(addDays(parseISO(x), 1), DK)) if (!have.has(x)) add.push({ date: x, status: 'failure', auto: true });
  if (add.length) { ch = true; disciplineRecords = [...disciplineRecords, ...add].sort((a, b) => a.date.localeCompare(b.date)); }
  const importantEvents = d.importantEvents.map((e) => {
    if (e.status === 'upcoming' && deadline(e).getTime() < now) { ch = true; return { ...e, status: 'expired' as const }; }
    return e;
  });
  return ch ? { ...d, dailyMissions, importantEvents, disciplineRecords } : d;
}

export function ringProgress(e: ImportantEvent, now: number) {
  const end = deadline(e).getTime(), start = new Date(e.createdAt).getTime(), total = end - start;
  if (!(total > 0)) return 1;
  return Math.min(1, Math.max(0, (now - start) / total));
}

export function fmtLeft(ms: number) {
  if (ms <= 0) return { n: '0', unit: tr('انتهى الموعد') };
  const d = Math.floor(ms / 864e5);
  if (d >= 1) return { n: String(d), unit: d === 1 ? tr('يوم متبقٍ') : tr('أيام متبقية') };
  const s = Math.floor(ms / 1000), p = (x: number) => String(x).padStart(2, '0');
  return { n: `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`, unit: tr('متبقية') };
}

export function leftMessage(ms: number) {
  const d = ms / 864e5;
  if (d > 7) return tr('ما زال لديك الوقت، استعد جيداً.');
  if (d >= 3) return tr('الموعد يقترب، حافظ على تركيزك.');
  if (d >= 1) return tr('كل ساعة أصبحت مهمة.');
  return tr('حان وقت تقديم أفضل ما لديك.');
}

export function daysText(ms: number) {
  const d = Math.floor(ms / 864e5);
  if (d >= 1) return d === 1 ? tr('غداً') : d === 2 ? tr('بعد يومين') : `${tr('بعد')} ${d} ${d <= 10 ? tr('أيام') : tr('يوماً')}`;
  const h = Math.floor(ms / 36e5);
  return h >= 1 ? `${tr('بعد')} ${h} ${tr('ساعة')}` : tr('خلال أقل من ساعة');
}

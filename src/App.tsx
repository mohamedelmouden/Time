import { getLang, loc, tr } from './i18n';
import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from 'date-fns';
import { BarChart3, CalendarClock, CalendarPlus, Check, ChevronLeft, ChevronRight, Database, Download, Flame as FlameIcon, History, Home as HomeIcon, ListChecks, Palette, Pencil, Plus, Receipt, Star, Target, Trash2, Upload } from 'lucide-react';
import { useApp } from './store';
import { CAT, Flame, PRIO, Ring, Sheet, useNow } from './components';
import { EventSheet, MissionSheet, TodayTaskSheet } from './forms';
import { ExpensesPage } from './expenses';
import { isWeeklyReminderTime, WeeklyStats } from './weekly';
import { PTS, markableDay, daysText, deadline, leftMessage, points, streaks, DK } from './logic';
import type { AccentColor, DailyMission, ImportantEvent } from './types';

const fd = (d: string, f = 'EEEE d MMMM') => format(parseISO(d), f, { locale: loc() });
const WIN: string[] = ['أحسنت! شعلتك تكبر.', 'انضباطك يصنع الفرق.', 'يوم آخر في رصيدك. استمر ولا تستسلم.'];
const ACCENTS: { id: AccentColor; label: string; swatch: string; highlight: string }[] = [
  { id: 'orange', label: 'برتقالي', swatch: '#FF8A32', highlight: '#FFC15A' },
  { id: 'yellow', label: 'أصفر', swatch: '#CA8A04', highlight: '#FACC15' },
  { id: 'pink', label: 'وردي', swatch: '#DB2777', highlight: '#F472B6' },
  { id: 'red', label: 'أحمر', swatch: '#DC2626', highlight: '#F87171' },
  { id: 'blue', label: 'أزرق', swatch: '#2563EB', highlight: '#60A5FA' },
  { id: 'purple', label: 'بنفسجي', swatch: '#9333EA', highlight: '#C084FC' },
  { id: 'green', label: 'أخضر', swatch: '#16A34A', highlight: '#4ADE80' },
  { id: 'cyan', label: 'سماوي', swatch: '#0891B2', highlight: '#67E8F9' },
];
const pct = (m: DailyMission) => (m.tasks.length ? Math.round((m.tasks.filter((t) => t.completed).length / m.tasks.length) * 100) : 0);
const evState = (e: ImportantEvent, now: number) => {
  if (e.status === 'completed') return tr('اكتمل');
  if (e.status === 'expired') return tr('انتهى الموعد');
  const ms = deadline(e).getTime() - now;
  return e.eventDate === format(now, DK) ? tr('اليوم') : ms < 7 * 864e5 ? tr('قريب') : tr('قادم');
};
const liveEvents = (evs: ImportantEvent[]) => evs.filter((e) => e.status === 'upcoming').sort((a, b) => deadline(a).getTime() - deadline(b).getTime());

function MissionCard({ m, onEdit }: { m: DailyMission; onEdit: (m: DailyMission) => void }) {
  const s = useApp();
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div><div className="font-bold">{fd(m.scheduledDate)}</div><div className="text-sm text-tx2">{m.tasks.length} {tr('مهام')}</div></div>
        <div className="flex gap-2"><button className="icon-b" aria-label={tr('تعديل')} onClick={() => onEdit(m)}><Pencil size={18} /></button>
          <button className="icon-b text-bad" aria-label={tr('حذف')} onClick={() => confirm(tr('حذف هذه المهمة؟')) && s.deleteMission(m.id)}><Trash2 size={18} /></button></div>
      </div>
      <ul className="mt-2 text-sm text-tx2 list-disc ps-5">{m.tasks.slice(0, 2).map((t) => <li key={t.id}>{t.title}</li>)}{m.tasks.length > 2 && <li>{tr('و')} {m.tasks.length - 2} {tr('أخرى…')}</li>}</ul>
    </div>
  );
}

function Home({ editM, newM, newE, onWeeklyReport }: { editM: (m: DailyMission) => void; newM: () => void; newE: () => void; onWeeklyReport: () => void }) {
  const s = useApp(); const { data, today } = s; const now = useNow(15000);
  const { cur, best } = streaks(data.disciplineRecords, s.eff);
  const vd = markableDay(new Date(now));
  const rec = data.disciplineRecords.find((r) => r.date === (vd ?? today));
  const [editing, setEditing] = useState(false); const [msg, setMsg] = useState(''); const [todayTaskOpen, setTodayTaskOpen] = useState(false);
  const tm = data.dailyMissions.find((m) => m.status === 'active');
  const ups = data.dailyMissions.filter((m) => m.status === 'upcoming').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const evs = liveEvents(data.importantEvents); const near = evs[0];
  const weeklyReminder = isWeeklyReminderTime(new Date(now));
  const choose = (st: 'success' | 'failure') => {
    if (rec && !confirm(tr('تعديل تسجيل اليوم؟'))) return;
    s.validate(st); setEditing(false);
    setMsg(st === 'success' ? `+${PTS.win} ${tr('نقطة')} — ${tr(WIN[Math.floor(Math.random() * WIN.length)])}` : `${PTS.lose} ${tr('نقطة')} — ${tr('خسرت اليوم، ابدأ من جديد.')}`);
    setTimeout(() => setMsg(''), 3500);
  };
  const done = tm && tm.tasks.length > 0 && tm.tasks.every((t) => t.completed);
  return (
    <div className="space-y-4">
      {weeklyReminder && <section className="card border-flame/30 bg-gradient-to-br from-flame/10 to-gold/5">
        <div className="font-bold">{tr('لا تنسَ تحصيل هذا الأسبوع')}</div>
        <p className="text-sm text-tx2 mt-1">{tr('أصبح تقرير الأسبوع جاهزاً. احفظ مصاريفك ومهامك المنجزة في PDF.')}</p>
        <button className="btn-p w-full mt-3" onClick={onWeeklyReport}><Download size={16} />{tr('تحميل التقرير الأسبوعي')}</button>
      </section>}
      <section className="card text-center">
        <div className="flex justify-between text-sm text-tx2"><span className="inline-flex items-center gap-1 text-gold font-bold"><Star size={16} />{points(data)} {tr('نقطة')}</span><span>{tr('الرقم القياسي:')} {best}</span></div>
        <Flame days={cur} />
        <div className="text-6xl font-bold">{cur}</div>
        <div className="text-tx2">{tr('أيام من الانضباط')}</div>
        <div className="text-sm mt-1 text-gold">{tr('شعلتك مستمرة. انضباطك يتحول إلى قوة.')}</div>
        <div className="mt-4">
          {vd && <div className="text-xs text-tx2 mb-2">{tr('اليوم المفتوح للتسجيل:')} {fd(vd, 'EEEE d MMMM')}</div>}
          {!vd && !rec ? (<p className="text-sm text-tx2">{tr('التسجيل مفتوح من 22:00 إلى 08:00 فقط. إن لم تسجّل قبل 08:00 يُحتسب اليوم خسارة.')}</p>) : rec && !editing ? (
            <div className="flex items-center justify-center gap-3"><span className={`font-bold ${rec.status === 'success' ? 'text-ok' : 'text-bad'}`}>{rec.status === 'success' ? tr('سجّلت انتصار اليوم') : tr('سجّلت خسارة اليوم')}</span>
              {vd && <button className="btn-g" onClick={() => setEditing(true)}>{tr('تعديل')}</button>}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2"><button className="btn-p" onClick={() => choose('success')}>🔥 {tr('انتصرت اليوم')}</button><button className="btn-g text-bad" onClick={() => choose('failure')}>{tr('خسرت اليوم')}</button></div>
          )}
        </div>
        <AnimatePresence>{msg && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-bg2 p-3 font-bold text-gold">{msg}</motion.div>}</AnimatePresence>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2 flex items-center gap-2"><Target size={18} className="text-flame" />{tr('مهمتي اليوم')}</h2>
        {tm ? (<>
          <div className="flex justify-between text-sm text-tx2 mb-1"><span>{tm.tasks.filter((t) => t.completed).length} / {tm.tasks.length} {tr('اكتملت')}</span><span>{pct(tm)}%</span></div>
          <div className="h-3 rounded-full bg-track overflow-hidden"><motion.div className={`h-full rounded-full ${done ? 'bg-gold' : 'bg-flame'}`} animate={{ width: `${pct(tm)}%` }} style={done ? { boxShadow: '0 0 14px rgb(var(--gold))' } : undefined} /></div>
          <ul className="mt-3 space-y-2">{tm.tasks.map((t) => (
            <li key={t.id}><button onClick={() => s.toggleTask(tm.id, t.id)} className="w-full min-h-[44px] flex items-start gap-3 text-start rounded-xl bg-bg2 p-3">
              <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-lg border-2 grid place-items-center ${t.completed ? 'bg-ok border-ok text-[#0B0D12]' : 'border-tx2'}`}>{t.completed && <Check size={16} />}</span>
              <span><span className={t.completed ? 'line-through text-tx2' : ''}>{t.title}</span>{t.description && <span className="block text-xs text-tx2">{t.description}</span>}</span></button></li>))}</ul>
          <AnimatePresence>{done && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-center font-bold text-gold">🔥 {tr('أحسنت! لقد أوفيت بوعدك لنفسك.')} (+{PTS.allDone} {tr('نقطة')})</motion.div>}</AnimatePresence>
        </>) : <p className="text-tx2 text-sm">{tr('لا توجد مهام لهذا اليوم، استعد لمهمتك القادمة.')}</p>}
        <button className="btn-g w-full mt-3" onClick={() => setTodayTaskOpen(true)}><Plus size={16} />{tr('أضف مهمة أنجزتها اليوم')}</button>
      </section>

      <section className="card">
        <div className="flex justify-between items-center mb-2"><h2 className="font-bold flex items-center gap-2"><CalendarClock size={18} className="text-flame" />{tr('أقرب موعد')}</h2><button className="btn-g" onClick={newE}><Plus size={16} />{tr('موعد')}</button></div>
        {near ? (<>
          <div className="text-center font-bold text-lg">{near.title}</div>
          <div className="text-center text-xs text-tx2 mb-2">{fd(near.eventDate, 'd MMMM yyyy')} · {CAT[near.category]} · {PRIO[near.priority]}</div>
          <Ring ev={near} big />
          <p className="text-center text-sm text-gold mt-2">{leftMessage(deadline(near).getTime() - now)}</p>
          {evs.length > 1 && <div className="grid grid-cols-2 gap-3 mt-4">{evs.slice(1, 5).map((e) => <div key={e.id} className="rounded-2xl bg-bg2 p-3 text-center"><Ring ev={e} /><div className="text-sm font-bold mt-1 truncate">{e.title}</div></div>)}</div>}
          <h3 className="mt-4 mb-1 text-sm font-bold">{tr('تذكّر ما ينتظرك')}</h3>
          <ul className="text-sm text-tx2 space-y-1">{evs.slice(0, 3).map((e) => <li key={e.id}>• {e.title} — {daysText(deadline(e).getTime() - now)}</li>)}</ul>
        </>) : <p className="text-tx2 text-sm">{tr('لا توجد مواعيد قادمة. أضف موعداً لتبقيه أمام عينيك.')}</p>}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2"><h2 className="font-bold">{tr('مهام الغد والأيام القادمة')}</h2><button className="btn-g" onClick={newM}><Plus size={16} />{tr('مهمة')}</button></div>
        <div className="space-y-3">{ups.length ? ups.map((m) => <MissionCard key={m.id} m={m} onEdit={editM} />) : <p className="text-tx2 text-sm">{tr('حضّر مهام الغد اليوم، وأوفِ بها غداً.')}</p>}</div>
      </section>
      <TodayTaskSheet open={todayTaskOpen} onClose={() => setTodayTaskOpen(false)} />
    </div>
  );
}

function EventsPage({ edit }: { edit: (e: ImportantEvent) => void }) {
  const s = useApp(); const now = useNow(60000); const [open, setOpen] = useState<string | null>(null);
  const live = liveEvents(s.data.importantEvents);
  const past = s.data.importantEvents.filter((e) => e.status !== 'upcoming').sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const Row = ({ e }: { e: ImportantEvent }) => (
    <div className="card">
      <button className="w-full flex items-center gap-3 text-start" onClick={() => setOpen(open === e.id ? null : e.id)}>
        <div className="w-24 shrink-0"><Ring ev={e} /></div>
        <div className="min-w-0"><div className="font-bold truncate">{e.title}</div><div className="text-xs text-tx2">{fd(e.eventDate, 'd MMMM yyyy')}{e.eventTime ? ` · ${e.eventTime}` : ''}</div>
          <div className="text-xs mt-1"><span className="text-gold">{evState(e, now)}</span> · {CAT[e.category]} · {PRIO[e.priority]}</div></div>
      </button>
      {open === e.id && <div className="mt-3 border-t border-line/10 pt-3 text-sm">{e.description && <p className="text-tx2 mb-3">{e.description}</p>}
        {e.status === 'upcoming' ? <div className="flex gap-2"><button className="btn-p flex-1" onClick={() => s.completeEvent(e.id)}><Check size={16} />{tr('اكتمل')}</button><button className="icon-b" aria-label={tr('تعديل')} onClick={() => edit(e)}><Pencil size={18} /></button>
          <button className="icon-b text-bad" aria-label={tr('حذف')} onClick={() => confirm(tr('حذف هذا الموعد؟')) && s.deleteEvent(e.id)}><Trash2 size={18} /></button></div>
          : <button className="icon-b text-bad" aria-label={tr('حذف')} onClick={() => confirm(tr('حذف هذا الموعد؟')) && s.deleteEvent(e.id)}><Trash2 size={18} /></button>}</div>}
    </div>
  );
  return (
    <div className="space-y-3"><h1 className="text-xl font-bold">{tr('الأحداث المهمة القادمة')}</h1>
      {live.length ? live.map((e) => <Row key={e.id} e={e} />) : <p className="text-tx2">{tr('لا توجد مواعيد قادمة. اضغط')} + {tr('لإضافة موعد.')}</p>}
      {past.length > 0 && <><h2 className="font-bold pt-3">{tr('المنتهية والمكتملة')}</h2>{past.map((e) => <Row key={e.id} e={e} />)}</>}
    </div>
  );
}

function CalendarView() {
  const s = useApp(); const [m, setM] = useState(parseISO(s.today));
  const days = eachDayOfInterval({ start: startOfMonth(m), end: endOfMonth(m) });
  const pad = (getDay(days[0]) + (getLang() === 'ar' ? 1 : 6)) % 7; // week starts Saturday (ar) / Monday (fr)
  const cls = (d: string) => { const r = s.data.disciplineRecords.find((x) => x.date === d); return r ? (r.status === 'success' ? 'bg-gradient-to-br from-flame to-gold text-[#0B0D12] font-bold' : 'bg-bad text-white') : 'bg-track text-tx2'; };
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3"><button className="icon-b" aria-label={tr('الشهر السابق')} onClick={() => setM(addMonths(m, -1))}>{getLang() === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}</button><div className="font-bold">{format(m, 'MMMM yyyy', { locale: loc() })}</div><button className="icon-b" aria-label={tr('الشهر التالي')} onClick={() => setM(addMonths(m, 1))}>{getLang() === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button></div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-tx2 mb-1">{(getLang() === 'ar' ? ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D']).map((x, i) => <div key={i}>{x}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{Array.from({ length: pad }).map((_, i) => <div key={i} />)}{days.map((d) => { const k = format(d, DK); return <div key={k} className={`aspect-square grid place-items-center rounded-lg text-sm ${cls(k)} ${k === s.today ? 'ring-2 ring-gold' : ''}`}>{format(d, 'd')}</div>; })}</div>
    </div>
  );
}

function HistoryPage() {
  const s = useApp(); const [tab, setTab] = useState(0);
  const ms = s.data.dailyMissions.filter((m) => m.status === 'archived').sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  const es = s.data.importantEvents.filter((e) => e.status !== 'upcoming').sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const { cur, best } = streaks(s.data.disciplineRecords, s.eff);
  return (
    <div className="space-y-3"><h1 className="text-xl font-bold">{tr('سجل الإنجازات')}</h1>
      <div className="grid grid-cols-3 gap-2">{[tr('الانضباط'), tr('المهام'), tr('المواعيد')].map((t, i) => <button key={t} onClick={() => setTab(i)} className={`btn ${tab === i ? 'bg-flame text-[#0B0D12]' : 'bg-card'}`}>{t}</button>)}</div>
      {tab === 0 && <><CalendarView /><div className="card flex justify-around text-center"><div><div className="text-2xl font-bold">{cur}</div><div className="text-xs text-tx2">{tr('الحالية')}</div></div><div><div className="text-2xl font-bold">{best}</div><div className="text-xs text-tx2">{tr('الأطول')}</div></div></div></>}
      {tab === 1 && (ms.length ? ms.map((m) => <div key={m.id} className="card"><div className="flex justify-between font-bold"><span>{fd(m.scheduledDate)}</span><span className="text-gold">{m.tasks.filter((t) => t.completed).length}/{m.tasks.length} — {pct(m)}%</span></div>
        <ul className="mt-2 text-sm space-y-1">{m.tasks.map((t) => <li key={t.id} className={t.completed ? 'text-ok' : 'text-bad'}>{t.title}: {t.completed ? tr('مكتملة') : tr('غير مكتملة')}</li>)}</ul></div>) : <p className="text-tx2">{tr('لا توجد مهام مؤرشفة بعد.')}</p>)}
      {tab === 2 && (es.length ? es.map((e) => <div key={e.id} className="card"><div className="font-bold">{e.title}</div><div className="text-sm text-tx2">{fd(e.eventDate, 'd MMMM yyyy')} · {CAT[e.category]}</div><div className={`text-sm ${e.status === 'completed' ? 'text-ok' : 'text-bad'}`}>{e.status === 'completed' ? tr('اكتمل') : tr('انتهى الموعد')}</div></div>) : <p className="text-tx2">{tr('لا توجد مواعيد منتهية بعد.')}</p>)}
    </div>
  );
}

function StatsPage() {
  const s = useApp(); const file = useRef<HTMLInputElement>(null); const [reset, setReset] = useState(false);
  const { cur, best } = streaks(s.data.disciplineRecords, s.eff);
  const ok = s.data.disciplineRecords.filter((r) => r.status === 'success').length;
  const stats = [[tr('الحالية'), cur], [tr('الأطول'), best], [tr('أيام النجاح'), ok], [tr('أيام الخسارة'), s.data.disciplineRecords.length - ok]];
  const exp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s.exportJson()], { type: 'application/json' })); a.download = `flame-backup-${s.today}.json`; a.click(); };
  const imp = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => { if (confirm(tr('سيتم استبدال بياناتك الحالية. متابعة؟'))) alert(s.importJson(String(r.result)) ? tr('تم الاستيراد') : tr('ملف غير صالح')); }; r.readAsText(f); };
  return (
    <div className="space-y-4"><h1 className="text-xl font-bold">{tr('الإحصائيات')}</h1>
      <WeeklyStats />
      <div className="card text-center"><div className="text-sm text-tx2">{tr('النقاط التراكمية')}</div><div className="text-5xl font-bold text-gold">{points(s.data)}</div>
        <div className="text-xs text-tx2 mt-2">+{PTS.win} {tr('لكل يوم انتصار')} · +{PTS.allDone} {tr('عند إتمام كل مهام اليوم')} · {PTS.lose} {tr('عند الخسارة')}</div></div>
      <div className="grid grid-cols-2 gap-3">{stats.map(([l, v]) => <div key={l} className="card text-center"><div className="text-3xl font-bold">{v}</div><div className="text-sm text-tx2">{l}</div></div>)}</div>
      <h2 className="text-lg font-bold pt-2">{tr('الإعدادات')}</h2>
      <section className="card space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Palette size={18} className="text-flame" />{tr('المظهر والتخصيص')}</h2>
        <div className="space-y-2">
          <h3 className="text-sm font-bold">{tr('سمة الواجهة')}</h3>
          <div className="grid grid-cols-3 gap-2">{([['dark', tr('داكن')], ['light', tr('فاتح')], ['system', tr('النظام')]] as const).map(([k, label]) => <button key={k} aria-pressed={s.data.settings.theme === k} onClick={() => s.setTheme(k)} className={`btn px-2 ${s.data.settings.theme === k ? 'bg-flame text-[#0B0D12]' : 'bg-bg2 border border-line/10'}`}>{label}</button>)}</div>
        </div>
        <div className="space-y-2 border-t border-line/10 pt-3">
          <div><h3 className="text-sm font-bold">{tr('لون الموقع')}</h3><p className="text-xs text-tx2">{tr('اختر لون التمييز الذي تفضله.')}</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{ACCENTS.map((accent) => {
            const selected = s.data.settings.accentColor === accent.id;
            return <button key={accent.id} aria-label={tr(accent.label)} aria-pressed={selected} title={tr(accent.label)} onClick={() => s.setAccentColor(accent.id)} className={`min-h-11 rounded-xl bg-bg2 border px-3 flex items-center gap-2 text-sm font-bold transition active:scale-95 ${selected ? 'border-flame' : 'border-line/10'}`} style={selected ? { borderColor: accent.swatch, boxShadow: `0 0 0 1px ${accent.swatch}55` } : undefined}>
              <span className="w-5 h-5 shrink-0 rounded-full border border-white/20" style={{ background: `linear-gradient(135deg, ${accent.swatch}, ${accent.highlight})` }} />
              <span className="flex-1 text-start">{tr(accent.label)}</span>{selected && <Check size={15} className="shrink-0" />}
            </button>;
          })}</div>
          <p className="text-xs text-tx2">{tr('البرتقالي هو اللون الافتراضي.')}</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div><h2 className="font-bold flex items-center gap-2"><Database size={18} className="text-flame" />{tr('البيانات والنسخ الاحتياطي')}</h2><p className="text-xs text-tx2 mt-1">{tr('احفظ نسخة من بياناتك أو استعد نسخة سابقة.')}</p></div>
        <div className="grid grid-cols-2 gap-2"><button className="btn-g px-2" onClick={exp}><Download size={16} />{tr('تصدير')} JSON</button><button className="btn-g px-2" onClick={() => file.current?.click()}><Upload size={16} />{tr('استيراد')} JSON</button></div>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { imp(e.target.files?.[0]); e.target.value = ''; }} />
        <p className="text-xs text-tx2">{tr('بياناتك محفوظة في هذا المتصفح وهذا الجهاز فقط، ولا توجد مزامنة بين الهاتف والحاسوب. استخدم التصدير والاستيراد لنقلها.')}</p>
      </section>

      <section className="card border border-bad/20 space-y-3">
        <h2 className="font-bold flex items-center gap-2 text-bad"><Trash2 size={17} />{tr('إدارة البيانات')}</h2>
        <p className="text-sm text-tx2">{tr('سيحذف هذا الإجراء الانضباط والمهام والمصاريف والمواعيد من هذا الجهاز.')}</p>
        <button className="btn-g w-full text-bad border-bad/20" onClick={() => setReset(true)}>{tr('مسح كل البيانات')}</button>
      </section>
      <Sheet open={reset} onClose={() => setReset(false)} title={tr('مسح كل البيانات؟')}><p className="text-tx2 mb-4">{tr('سيتم حذف الانضباط والمهام والمصاريف والمواعيد نهائياً. صدّر نسخة احتياطية أولاً.')}</p><div className="grid grid-cols-2 gap-2"><button className="btn-g" onClick={() => setReset(false)}>{tr('إلغاء')}</button><button className="btn bg-bad text-white" onClick={() => { s.reset(); setReset(false); }}>{tr('نعم، امسح')}</button></div></Sheet>
    </div>
  );
}

export default function App() {
  const s = useApp(); const [tab, setTab] = useState(0);
  const [mOpen, setMOpen] = useState(false); const [mEdit, setMEdit] = useState<DailyMission | null>(null);
  const [eOpen, setEOpen] = useState(false); const [eEdit, setEEdit] = useState<ImportantEvent | null>(null);
  const theme = s.data.settings.theme;
  const accentColor = s.data.settings.accentColor;
  const accentHex = ACCENTS.find((accent) => accent.id === accentColor)?.swatch ?? ACCENTS[0].swatch;
  useLayoutEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    const apply = () => {
      document.documentElement.classList.toggle('light', theme === 'light' || (theme === 'system' && !!mq?.matches));
      document.documentElement.dataset.accent = accentColor;
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', accentHex);
    };
    apply();
    if (!mq) return;
    if (typeof mq.addEventListener === 'function') { mq.addEventListener('change', apply); return () => mq.removeEventListener('change', apply); }
    if (typeof mq.addListener === 'function') { mq.addListener(apply); return () => mq.removeListener(apply); }
  }, [theme, accentColor, accentHex]);
  const openM = (m: DailyMission | null) => { setMEdit(m); setMOpen(true); };
  const openE = (e: ImportantEvent | null) => { setEEdit(e); setEOpen(true); };
  const nav = [[HomeIcon, tr('الرئيسية')], [History, tr('السجل')], [Receipt, tr('المصاريف')], [CalendarClock, tr('المواعيد')], [BarChart3, tr('الإحصائيات')]] as const;
  return (
    <div className="app-shell mx-auto max-w-xl md:max-w-2xl px-3 sm:px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-36">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-2xl font-bold"><FlameIcon className="text-[#FF8A32]" size={21} fill="#FF8A32" />FLAME</div>
        <div className="flex items-center gap-2"><button className="icon-b font-bold" aria-label={tr('تغيير اللغة')} onClick={() => s.setLang(s.data.settings.lang === 'ar' ? 'fr' : 'ar')}>{s.data.settings.lang === 'ar' ? 'FR' : 'AR'}</button><div className="text-xs sm:text-sm text-tx2 text-end"><div>{fd(s.today, 'EEEE d MMMM')}</div><div className="text-gold">{tr('احمِ وقتك، واحفظ شعلتك.')}</div></div></div>
      </header>
      <main className="app-main">{tab === 0 && <Home editM={openM} newM={() => openM(null)} newE={() => openE(null)} onWeeklyReport={() => setTab(4)} />}{tab === 1 && <HistoryPage />}{tab === 2 && <ExpensesPage />}{tab === 3 && <EventsPage edit={openE} />}{tab === 4 && <StatsPage />}</main>
      <div className="fixed end-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex flex-col gap-3 z-30">
        {tab === 0 && <button aria-label={tr('مهمة جديدة')} onClick={() => openM(null)} className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-bg2 via-bg2 to-card border border-flame/40 text-gold grid place-items-center shadow-xl shadow-flame/10 active:scale-95 transition"><ListChecks className="w-4 h-4" /></button>}
        {(tab === 0 || tab === 3) && <button aria-label={tr('موعد جديد')} onClick={() => openE(null)} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gold via-[#FFB84A] to-flame text-[#0B0D12] grid place-items-center shadow-xl shadow-flame/35 ring-1 ring-gold/30 active:scale-95 transition"><CalendarPlus className="w-4 h-4" /></button>}
      </div>
      <nav className="app-nav fixed bottom-0 inset-x-0 z-40 bg-bg2/95 backdrop-blur border-t border-line/10 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl grid grid-cols-5">{nav.map(([Icon, l], i) => <button key={l} onClick={() => setTab(i)} className={`min-h-[56px] flex flex-col items-center justify-center text-[10px] sm:text-xs gap-1 ${tab === i ? 'text-flame' : 'text-tx2'}`}><Icon className="nav-icon" size={22} />{l}</button>)}</div>
      </nav>
      <MissionSheet open={mOpen} onClose={() => setMOpen(false)} edit={mEdit} />
      <EventSheet open={eOpen} onClose={() => setEOpen(false)} edit={eEdit} />
    </div>
  );
}

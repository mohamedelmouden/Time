import { useState } from 'react';
import { createPortal } from 'react-dom';
import { addDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getLang, loc, tr } from './i18n';
import { useApp } from './store';
import { DK } from './logic';
import type { DailyMission, ExpenseEntry } from './types';

const key = (date: Date) => format(date, DK);
const dateLabel = (date: string, pattern = 'EEEE d MMMM yyyy') => format(parseISO(date), pattern, { locale: loc() });
const money = (amount: number) => `${new Intl.NumberFormat(getLang() === 'fr' ? 'fr-MA' : 'ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${getLang() === 'fr' ? 'MAD' : 'د.م.'}`;
const inRange = (date: string, start: string, end: string) => date >= start && date <= end;

function WeeklyReport({ start, end, expenses, missions, completedTasks, totalTasks, successfulDays, failedDays, totalSpent }: {
  start: string; end: string; expenses: ExpenseEntry[]; missions: DailyMission[];
  completedTasks: number; totalTasks: number; successfulDays: number; failedDays: number; totalSpent: number;
}) {
  const tasks = missions.flatMap((mission) => mission.tasks.map((task) => ({ date: mission.scheduledDate, task })));
  return (
    <article className="print-report weekly-print-report" dir={getLang() === 'ar' ? 'rtl' : 'ltr'} lang={getLang()}>
      <header className="report-header">
        <div className="report-brand"><span className="report-flame">✦</span><span><strong>FLAME</strong><small>{tr('دفتر أسبوعي للإنفاق والإنجاز')}</small></span></div>
        <div className="report-heading"><div>{tr('التقرير الأسبوعي')}</div><small>FLAME · {start} — {end}</small></div>
      </header>
      <div className="report-date">{dateLabel(start, 'd MMMM yyyy')} — {dateLabel(end, 'd MMMM yyyy')}</div>

      <section className="report-summary">
        <div className="report-stat report-stat-total"><small>{tr('إجمالي المصروف')}</small><strong>{money(totalSpent)}</strong></div>
        <div className="report-stat"><small>{tr('المهام المكتملة')}</small><strong>{completedTasks} / {totalTasks}</strong></div>
        <div className="report-stat"><small>{tr('عدد المصاريف')}</small><strong>{expenses.length}</strong></div>
        <div className="report-stat"><small>{tr('أيام الانضباط')}</small><strong><span className="report-good">{successfulDays} {tr('نجاح')}</span> · <span className="report-bad">{failedDays} {tr('خسارة')}</span></strong></div>
      </section>

      <section className="report-section">
        <div className="report-section-title"><span>01</span><h2>{tr('تفاصيل مصاريف الأسبوع')}</h2><small>{tr('كل بند وسعره')}</small></div>
        <table className="report-table">
          <thead><tr><th>{tr('التاريخ')}</th><th>{tr('الوصف')}</th><th>{tr('السعر')} · MAD</th></tr></thead>
          <tbody>{expenses.length ? expenses.map((expense) => <tr key={expense.id}><td>{dateLabel(expense.date, 'EEE d MMM')}</td><td>{expense.description}</td><td className="report-amount">{money(expense.amount)}</td></tr>) : <tr><td colSpan={3} className="report-empty">{tr('لا توجد مصاريف مسجلة لهذا الأسبوع.')}</td></tr>}</tbody>
          <tfoot><tr><td colSpan={2}>{tr('الإجمالي')}</td><td className="report-amount">{money(totalSpent)}</td></tr></tfoot>
        </table>
      </section>

      <section className="report-section">
        <div className="report-section-title"><span>02</span><h2>{tr('المهام المنجزة خلال الأسبوع')}</h2><small>{completedTasks} / {totalTasks}</small></div>
        <table className="report-table">
          <thead><tr><th>{tr('التاريخ')}</th><th>{tr('المهمة')}</th><th>{tr('الحالة')}</th></tr></thead>
          <tbody>{tasks.length ? tasks.map(({ date, task }) => <tr key={`${date}-${task.id}`}><td>{dateLabel(date, 'EEE d MMM')}</td><td>{task.title}{task.description && <small className="report-subtext">{task.description}</small>}</td><td className={task.completed ? 'report-good' : 'report-muted'}>{task.completed ? tr('مكتملة') : tr('غير مكتملة')}</td></tr>) : <tr><td colSpan={3} className="report-empty">{tr('لا توجد مهام مسجلة لهذا الأسبوع.')}</td></tr>}</tbody>
        </table>
      </section>
      <footer className="report-footer"><span>FLAME</span><span>{tr('وقت أوضح، ومال أوعى.')}</span><span>{tr('تقرير شخصي')}</span></footer>
    </article>
  );
}

function ExpenseOnlyReport({ start, end, expenses, totalSpent }: { start: string; end: string; expenses: ExpenseEntry[]; totalSpent: number }) {
  return (
    <article className="print-report expense-only-print-report" dir={getLang() === 'ar' ? 'rtl' : 'ltr'} lang={getLang()}>
      <header className="report-header">
        <div className="report-brand"><span className="report-flame">✦</span><span><strong>FLAME</strong><small>{tr('تقرير المصاريف فقط')}</small></span></div>
        <div className="report-heading"><div>{tr('تقرير المصاريف الأسبوعي')}</div><small>FLAME · {start} — {end}</small></div>
      </header>
      <div className="report-date">{dateLabel(start, 'd MMMM yyyy')} — {dateLabel(end, 'd MMMM yyyy')}</div>
      <section className="report-summary">
        <div className="report-stat report-stat-total"><small>{tr('إجمالي المصروف')}</small><strong>{money(totalSpent)}</strong></div>
        <div className="report-stat"><small>{tr('عدد المصاريف')}</small><strong>{expenses.length}</strong></div>
      </section>
      <section className="report-section">
        <div className="report-section-title"><span>01</span><h2>{tr('تفاصيل المصاريف')}</h2><small>{tr('كل بند وسعره')}</small></div>
        <table className="report-table">
          <thead><tr><th>{tr('التاريخ')}</th><th>{tr('الوصف')}</th><th>{tr('السعر')} · MAD</th></tr></thead>
          <tbody>{expenses.length ? expenses.map((expense) => <tr key={expense.id}><td>{dateLabel(expense.date, 'EEE d MMM')}</td><td>{expense.description}</td><td className="report-amount">{money(expense.amount)}</td></tr>) : <tr><td colSpan={3} className="report-empty">{tr('لا توجد مصاريف مسجلة لهذا الأسبوع.')}</td></tr>}</tbody>
          <tfoot><tr><td colSpan={2}>{tr('الإجمالي')}</td><td className="report-amount">{money(totalSpent)}</td></tr></tfoot>
        </table>
      </section>
      <footer className="report-footer"><span>FLAME</span><span>{tr('وقت أوضح، ومال أوعى.')}</span><span>{tr('تقرير شخصي')}</span></footer>
    </article>
  );
}

export function WeeklyStats() {
  const s = useApp();
  const [weekStart, setWeekStart] = useState(() => key(startOfWeek(parseISO(s.today), { weekStartsOn: 1 })));
  const start = parseISO(weekStart);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  const startKey = key(start);
  const endKey = key(end);
  const currentStart = key(startOfWeek(parseISO(s.today), { weekStartsOn: 1 }));
  const canGoForward = weekStart < currentStart;
  const expenses = s.data.expenseEntries.filter((entry) => inRange(entry.date, startKey, endKey) && entry.date <= s.today);
  const missions = s.data.dailyMissions.filter((mission) => inRange(mission.scheduledDate, startKey, endKey) && mission.scheduledDate <= s.today);
  const records = s.data.disciplineRecords.filter((record) => inRange(record.date, startKey, endKey) && record.date <= s.today);
  const totalSpent = expenses.reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0) / 100;
  const completedTasks = missions.reduce((sum, mission) => sum + mission.tasks.filter((task) => task.completed).length, 0);
  const totalTasks = missions.reduce((sum, mission) => sum + mission.tasks.length, 0);
  const successfulDays = records.filter((record) => record.status === 'success').length;
  const failedDays = records.filter((record) => record.status === 'failure').length;
  const printReport = (report: 'weekly' | 'expenses') => {
    const title = document.title;
    document.title = `FLAME-${report === 'expenses' ? 'expenses-' : 'week-'}${startKey}`;
    document.body.dataset.printReport = report;
    try { window.print(); } finally { delete document.body.dataset.printReport; document.title = title; }
  };

  return <>
    <section className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button className="icon-b" aria-label={tr('الأسبوع السابق')} onClick={() => setWeekStart(key(addDays(start, -7)))}>{getLang() === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
        <div className="text-center min-w-0"><h2 className="font-bold">{tr('التحصيل الأسبوعي')}</h2><p className="text-xs sm:text-sm text-tx2">{dateLabel(startKey, 'd MMMM yyyy')} — {dateLabel(endKey, 'd MMMM yyyy')}</p></div>
        <button className="icon-b disabled:opacity-30 disabled:pointer-events-none" aria-label={tr('الأسبوع التالي')} disabled={!canGoForward} onClick={() => setWeekStart(key(addDays(start, 7)))}>{getLang() === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-bg2 p-3 text-center"><div className="text-xl sm:text-2xl font-bold text-gold" dir="auto">{money(totalSpent)}</div><div className="text-xs text-tx2">{tr('إجمالي المصروف')}</div></div>
        <div className="rounded-2xl bg-bg2 p-3 text-center"><div className="text-xl sm:text-2xl font-bold">{completedTasks} / {totalTasks}</div><div className="text-xs text-tx2">{tr('المهام المكتملة')}</div></div>
        <div className="rounded-2xl bg-bg2 p-3 text-center"><div className="text-xl sm:text-2xl font-bold">{expenses.length}</div><div className="text-xs text-tx2">{tr('عدد المصاريف')}</div></div>
        <div className="rounded-2xl bg-bg2 p-3 text-center"><div className="text-xl sm:text-2xl font-bold"><span className="text-ok">{successfulDays}</span> / <span className="text-bad">{failedDays}</span></div><div className="text-xs text-tx2">{tr('أيام النجاح')} / {tr('أيام الخسارة')}</div></div>
      </div>
      <p className="text-xs text-tx2">{tr('يبدأ الأسبوع يوم الإثنين وينتهي يوم الأحد.')}</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-p px-2 text-sm" onClick={() => printReport('weekly')}><Download size={16} />{tr('التقرير الكامل PDF')}</button>
        <button className="btn-g px-2 text-sm" onClick={() => printReport('expenses')}><Download size={16} />{tr('المصاريف فقط PDF')}</button>
      </div>
      <p className="text-xs text-tx2 text-center">{tr('عند الطباعة اختر حفظ كملف PDF.')}</p>
    </section>
    {createPortal(<><WeeklyReport start={startKey} end={endKey} expenses={expenses} missions={missions} completedTasks={completedTasks} totalTasks={totalTasks} successfulDays={successfulDays} failedDays={failedDays} totalSpent={totalSpent} /><ExpenseOnlyReport start={startKey} end={endKey} expenses={expenses} totalSpent={totalSpent} /></>, document.body)}
  </>;
}

export function isWeeklyReminderTime(now: Date) {
  return now.getDay() === 0 && (now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30));
}

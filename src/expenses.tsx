import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Pencil, Plus, Receipt, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getLang, loc, tr } from './i18n';
import { useApp } from './store';
import type { DailyMission, DisciplineRecord, ExpenseEntry } from './types';

const dayLabel = (date: string) => format(parseISO(date), 'EEEE d MMMM yyyy', { locale: loc() });
const money = (amount: number) => `${new Intl.NumberFormat(getLang() === 'fr' ? 'fr-MA' : 'ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${getLang() === 'fr' ? 'MAD' : 'د.م.'}`;
const challengeLabel = (record?: DisciplineRecord) => record?.status === 'success' ? tr('أكملت التحدي') : record?.status === 'failure' ? tr('ضيعت الوقت') : tr('لم تسجل النتيجة');

function DailyReport({ date, expenses, total, record, mission }: { date: string; expenses: ExpenseEntry[]; total: number; record?: DisciplineRecord; mission?: DailyMission }) {
  const completed = mission?.tasks.filter((task) => task.completed).length ?? 0;
  return (
    <article className="print-report daily-print-report" dir={getLang() === 'ar' ? 'rtl' : 'ltr'} lang={getLang()}>
      <header className="report-header">
        <div className="report-brand"><span className="report-flame">✦</span><span><strong>FLAME</strong><small>{tr('دفتر يومي للإنفاق والانضباط')}</small></span></div>
        <div className="report-heading"><div>{tr('تقرير اليوم')}</div><small>FLAME · {date}</small></div>
      </header>

      <div className="report-date">{dayLabel(date)}</div>

      <section className="report-summary">
        <div className="report-stat report-stat-total"><small>{tr('إجمالي المصروف')}</small><strong>{money(total)}</strong></div>
        <div className="report-stat"><small>{tr('عدد المصاريف')}</small><strong>{expenses.length}</strong></div>
        <div className="report-stat"><small>{tr('نتيجة التحدي')}</small><strong className={record?.status === 'success' ? 'report-good' : record?.status === 'failure' ? 'report-bad' : ''}>{challengeLabel(record)}</strong></div>
      </section>

      <section className="report-section">
        <div className="report-section-title"><span>01</span><h2>{tr('تفاصيل المصاريف')}</h2><small>{tr('كل بند وسعره')}</small></div>
        <table className="report-table">
          <thead><tr><th>{tr('رقم')}</th><th>{tr('الوصف')}</th><th>{tr('السعر')} · MAD</th></tr></thead>
          <tbody>{expenses.length ? expenses.map((expense, index) => <tr key={expense.id}><td>{String(index + 1).padStart(2, '0')}</td><td>{expense.description}</td><td className="report-amount">{money(expense.amount)}</td></tr>) : <tr><td colSpan={3} className="report-empty">{tr('لا توجد مصاريف مسجلة لهذا اليوم.')}</td></tr>}</tbody>
          <tfoot><tr><td colSpan={2}>{tr('الإجمالي')}</td><td className="report-amount">{money(total)}</td></tr></tfoot>
        </table>
      </section>

      <section className="report-section report-challenge">
        <div className="report-section-title"><span>02</span><h2>{tr('الانضباط والتحدي')}</h2></div>
        <div className="report-challenge-box">
          <div><small>{tr('نتيجة اليوم')}</small><strong className={record?.status === 'success' ? 'report-good' : record?.status === 'failure' ? 'report-bad' : ''}>{challengeLabel(record)}</strong></div>
          <div><small>{tr('المهام اليومية')}</small><strong>{mission?.tasks.length ? `${completed} / ${mission.tasks.length} ${tr('مكتملة')}` : tr('لا توجد مهام لهذا اليوم')}</strong></div>
        </div>
        {mission?.tasks.length ? <ul className="report-task-list">{mission.tasks.map((task) => <li key={task.id} className={task.completed ? 'report-good' : 'report-muted'}><span>{task.completed ? '✓' : '○'}</span><span>{task.title}{task.description && <small>{task.description}</small>}</span><b>{task.completed ? tr('مكتملة') : tr('غير مكتملة')}</b></li>)}</ul> : null}
      </section>

      <footer className="report-footer"><span>FLAME</span><span>{tr('وقت أوضح، ومال أوعى.')}</span><span>{tr('تقرير شخصي')}</span></footer>
    </article>
  );
}

export function ExpensesPage() {
  const s = useApp();
  const [date, setDate] = useState(s.today);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const expenses = s.data.expenseEntries.filter((expense) => expense.date === date);
  const total = expenses.reduce((sum, expense) => sum + Math.round(expense.amount * 100), 0) / 100;
  const record = s.data.disciplineRecords.find((entry) => entry.date === date);
  const mission = s.data.dailyMissions.find((entry) => entry.scheduledDate === date);
  const parsedAmount = Number(amount);
  const canSave = !!description.trim() && Number.isFinite(parsedAmount) && parsedAmount >= 0.01 && Math.round(parsedAmount * 100) / 100 === parsedAmount && date <= s.today;

  const resetForm = () => { setDescription(''); setAmount(''); setEditing(null); };
  const saveExpense = () => {
    if (!canSave) return;
    if (editing) s.updateExpense(editing, description, parsedAmount);
    else s.addExpense(date, description, parsedAmount);
    resetForm();
  };
  const startEdit = (expense: ExpenseEntry) => { setEditing(expense.id); setDescription(expense.description); setAmount(String(expense.amount)); };
  const changeDate = (value: string) => { setDate(value); resetForm(); };
  const printReport = () => {
    const title = document.title;
    document.title = `FLAME-${date}`;
    document.body.dataset.printReport = 'daily';
    try { window.print(); } finally { delete document.body.dataset.printReport; document.title = title; }
  };

  return <>
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Receipt className="section-icon text-flame" size={22} /><h1 className="text-lg sm:text-xl font-bold">{tr('المصاريف اليومية')}</h1></div>

      <section className="card space-y-2">
        <label htmlFor="expense-date" className="text-sm text-tx2">{tr('اختر اليوم')}</label>
        <input id="expense-date" type="date" className="inp" value={date} max={s.today} onChange={(event) => changeDate(event.target.value)} />
        <p className="text-sm text-tx2">{dayLabel(date)}</p>
      </section>

      <section className="card text-center">
        <div className="text-sm text-tx2">{tr('إجمالي المصروف')}</div>
        <div className="text-3xl sm:text-4xl font-bold text-gold mt-1" dir="auto">{money(total)}</div>
        <div className="text-sm text-tx2 mt-2">{expenses.length} {tr(expenses.length === 1 ? 'مصروف' : 'مصروفات')} · MAD</div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">{editing ? tr('تعديل المصروف') : tr('أضف مصروفاً')}</h2>
        <div>
          <label htmlFor="expense-description" className="text-sm text-tx2">{tr('وصف المصروف')}</label>
          <input id="expense-description" className="inp mt-1" placeholder={tr('مثال: وجبة الغداء')} value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <div>
          <label htmlFor="expense-amount" className="text-sm text-tx2">{tr('السعر')} · MAD</label>
          <input id="expense-amount" type="number" min="0.01" step="0.01" inputMode="decimal" className="inp mt-1" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>
        <div className={`grid ${editing ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          <button className="btn-p disabled:opacity-40" disabled={!canSave} onClick={saveExpense}>{editing ? tr('حفظ التعديل') : <><Plus size={18} />{tr('أضف إلى اليوم')}</>}</button>
          {editing && <button className="btn-g" onClick={resetForm}><X size={18} />{tr('إلغاء التعديل')}</button>}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-2 mb-3"><h2 className="font-bold">{tr('تفاصيل المصاريف')}</h2><span className="text-xs text-tx2">{expenses.length} {tr(expenses.length === 1 ? 'مصروف' : 'مصروفات')}</span></div>
        {expenses.length ? <div className="space-y-2">{expenses.map((expense, index) => <div key={expense.id} className="flex items-center gap-3 rounded-2xl bg-bg2 p-3">
          <span className="w-8 h-8 shrink-0 rounded-xl grid place-items-center bg-card text-flame font-bold text-sm">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1"><div className="font-bold break-words">{expense.description}</div><div className="text-sm text-gold" dir="auto">{money(expense.amount)}</div></div>
          <button className="icon-b shrink-0" aria-label={tr('تعديل')} onClick={() => startEdit(expense)}><Pencil size={17} /></button>
          <button className="icon-b shrink-0 text-bad" aria-label={tr('حذف المصروف؟')} onClick={() => { if (confirm(tr('حذف المصروف؟'))) { s.deleteExpense(expense.id); if (editing === expense.id) resetForm(); } }}><Trash2 size={17} /></button>
        </div>)}</div> : <p className="text-sm text-tx2">{tr('لا توجد مصاريف مسجلة لهذا اليوم.')}</p>}
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">{tr('تقرير اليوم PDF')}</h2>
        <p className="text-sm text-tx2">{tr('يجمع التقرير مصاريف اليوم ونتيجة التحدي والمهام. عند الطباعة اختر حفظ كملف PDF.')}</p>
        <button className="btn-p w-full" onClick={printReport}><Download size={18} />{tr('طباعة أو حفظ PDF')}</button>
      </section>
    </div>

    {createPortal(<DailyReport date={date} expenses={expenses} total={total} record={record} mission={mission} />, document.body)}
  </>;
}

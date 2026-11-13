import { tr } from './i18n';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Sheet, CAT, PRIO } from './components';
import { Draft, useApp } from './store';
import type { Category, DailyMission, ImportantEvent, Priority } from './types';

export function MissionSheet({ open, onClose, edit }: { open: boolean; onClose: () => void; edit?: DailyMission | null }) {
  const s = useApp();
  const [date, setDate] = useState(s.tomorrow());
  const [tasks, setTasks] = useState<Draft[]>([{ title: '' }]);
  useEffect(() => { if (open) { setDate(edit ? edit.scheduledDate : s.tomorrow()); setTasks(edit ? edit.tasks.map((t) => ({ ...t })) : [{ title: '' }]); } }, [open, edit]);
  const set = (i: number, p: Partial<Draft>) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, ...p } : t)));
  const ok = tasks.some((t) => t.title.trim()) && date > s.today;
  const submit = () => { if (!ok) return; edit ? s.updateMission(edit.id, date, tasks) : s.addMission(date, tasks); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title={edit ? tr('تعديل المهمة') : tr('مهمة جديدة')}>
      <label className="text-sm text-tx2">{tr('تاريخ المهمة')}</label>
      <input type="date" className="inp mb-4" value={date} min={s.tomorrow()} onChange={(e) => setDate(e.target.value)} />
      <div className="space-y-3">
        {tasks.map((t, i) => (
          <div key={i} className="rounded-2xl bg-bg2 p-3 space-y-2">
            <div className="flex gap-2"><input className="inp" placeholder={tr('عنوان المهمة')} value={t.title} onChange={(e) => set(i, { title: e.target.value })} />
              {tasks.length > 1 && <button className="icon-b shrink-0" onClick={() => setTasks((ts) => ts.filter((_, j) => j !== i))} aria-label={tr('حذف')}><Trash2 size={18} /></button>}</div>
            <input className="inp" placeholder={tr('وصف (اختياري)')} value={t.description ?? ''} onChange={(e) => set(i, { description: e.target.value })} />
          </div>
        ))}
      </div>
      <button className="btn-g w-full mt-3" onClick={() => setTasks((ts) => [...ts, { title: '' }])}><Plus size={18} />{tr('أضف مهمة')}</button>
      <button className="btn-p w-full mt-4 disabled:opacity-40" disabled={!ok} onClick={submit}>{edit ? tr('احفظ التعديلات') : tr('احفظ المهمة')}</button>
    </Sheet>
  );
}

export function EventSheet({ open, onClose, edit }: { open: boolean; onClose: () => void; edit?: ImportantEvent | null }) {
  const s = useApp();
  const blank = { title: '', description: '', eventDate: s.today, eventTime: '', category: 'exam' as Category, priority: 'normal' as Priority };
  const [f, setF] = useState(blank);
  useEffect(() => { if (open) setF(edit ? { title: edit.title, description: edit.description ?? '', eventDate: edit.eventDate, eventTime: edit.eventTime ?? '', category: edit.category, priority: edit.priority } : { ...blank, eventDate: s.today }); }, [open, edit]);
  const u = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const ok = f.title.trim() && f.eventDate;
  const submit = () => {
    if (!ok) return;
    const v = { ...f, description: f.description.trim() || undefined, eventTime: f.eventTime || undefined };
    edit ? s.updateEvent(edit.id, v) : s.addEvent(v);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={edit ? tr('تعديل الموعد') : tr('موعد جديد')}>
      <div className="space-y-3">
        <input className="inp" placeholder={tr('عنوان الموعد')} value={f.title} onChange={(e) => u({ title: e.target.value })} />
        <input className="inp" placeholder={tr('وصف (اختياري)')} value={f.description} onChange={(e) => u({ description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-sm text-tx2">{tr('التاريخ')}</label><input type="date" className="inp" value={f.eventDate} min={edit ? undefined : s.today} onChange={(e) => u({ eventDate: e.target.value })} /></div>
          <div><label className="text-sm text-tx2">{tr('الوقت')} ({tr('اختياري')})</label><input type="time" className="inp" value={f.eventTime} onChange={(e) => u({ eventTime: e.target.value })} /></div>
          <div><label className="text-sm text-tx2">{tr('الفئة')}</label><select className="inp" value={f.category} onChange={(e) => u({ category: e.target.value as Category })}>{Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="text-sm text-tx2">{tr('الأولوية')}</label><select className="inp" value={f.priority} onChange={(e) => u({ priority: e.target.value as Priority })}>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
      </div>
      <button className="btn-p w-full mt-4 disabled:opacity-40" disabled={!ok} onClick={submit}>{edit ? tr('احفظ التعديلات') : tr('احفظ الموعد')}</button>
    </Sheet>
  );
}

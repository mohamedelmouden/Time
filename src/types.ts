export type Category = 'exam' | 'deadline' | 'competition' | 'appointment' | 'personal' | 'other';
export type Priority = 'normal' | 'important' | 'critical';
export type Theme = 'dark' | 'light' | 'system';
export interface DisciplineRecord { date: string; status: 'success' | 'failure'; auto?: boolean }
export interface ExpenseEntry { id: string; date: string; description: string; amount: number }
export interface Task { id: string; title: string; description?: string; completed: boolean }
export interface DailyMission { id: string; scheduledDate: string; tasks: Task[]; status: 'upcoming' | 'active' | 'archived'; createdAt: string; archivedAt?: string }
export interface ImportantEvent {
  id: string; title: string; description?: string; eventDate: string; eventTime?: string;
  category: Category; priority: Priority; status: 'upcoming' | 'completed' | 'expired'; createdAt: string; completedAt?: string;
}
export interface AppData { version: number; disciplineRecords: DisciplineRecord[]; expenseEntries: ExpenseEntry[]; dailyMissions: DailyMission[]; importantEvents: ImportantEvent[]; settings: { theme: Theme; lang: 'ar' | 'fr'; startDate: string } }

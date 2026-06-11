import type { Task, Note, AppSettings, TaskStats } from './types';

const TASKS_KEY = 'flashtask_tasks';
const NOTES_KEY = 'flashtask_notes';
const SETTINGS_KEY = 'flashtask_settings';

// Simple localStorage-based persistence
// In production, upgrade to IndexedDB for larger storage

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ---- Tasks ----

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function createTask(partial: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Task {
  const now = new Date().toISOString();
  return {
    ...partial,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = loadTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[idx];
}

export function deleteTask(id: string): void {
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

export function getTaskStats(): TaskStats {
  const tasks = loadTasks();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      return t.dueDate < today;
    }).length,
    todayCount: tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      return t.dueDate === today;
    }).length,
  };
}

// ---- Notes ----

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function createNote(partial: Omit<Note, 'id' | 'createdAt'>): Note {
  return {
    ...partial,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
}

// ---- Settings ----

const DEFAULT_SETTINGS: AppSettings = {
  aiMode: 'rule',
  llmEndpoint: '',
  llmApiKey: '',
  llmModel: 'gpt-4o-mini',
  notificationsEnabled: true,
  defaultReminderMinutes: 30,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- Export / Import ----

export function exportAllData(): string {
  return JSON.stringify({
    tasks: loadTasks(),
    notes: loadNotes(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.tasks) saveTasks(data.tasks);
    if (data.notes) saveNotes(data.notes);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch {
    return false;
  }
}

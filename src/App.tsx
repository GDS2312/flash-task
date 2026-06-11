import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, AppSettings } from './types';
import { useTasks } from './hooks/useTasks';
import { useNotification } from './hooks/useNotification';
import { loadSettings, saveSettings, getTaskStats } from './store';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { CaptureModal } from './components/CaptureModal';
import { SettingsPanel } from './components/SettingsPanel';
import { Plus, Search, Menu } from 'lucide-react';

function App() {
  const { tasks, refresh, editTask, removeTask, toggleStatus, addTasks } = useTasks();
  const { requestPermission, notify } = useNotification();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Modal states
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = useMemo(() => getTaskStats(), [tasks]);

  // Request notification permission on mount
  useEffect(() => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, []);

  // Check for due tasks and notify
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkDueTasks = () => {
      const now = new Date();
      const nowStr = now.toISOString().slice(0, 16);
      tasks.forEach(task => {
        if (task.status === 'completed') return;
        if (!task.reminder.enabled || !task.reminder.time) return;
        if (task.reminder.time <= nowStr && task.reminder.time > nowStr.slice(0, 13) + ':00') {
          notify('⏰ 任务提醒', {
            body: task.title,
            tag: task.id,
          });
        }
      });
    };

    const interval = setInterval(checkDueTasks, 60000);
    checkDueTasks();
    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled, notify]);

  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.notificationsEnabled) {
      requestPermission();
    }
  }, [requestPermission]);

  const handleTasksCreated = useCallback((newTasks: Task[]) => {
    addTasks(newTasks);
    setCaptureOpen(false);
  }, [addTasks]);

  const handleTaskClick = useCallback((id: string) => {
    setSelectedTaskId(id);
    setSidebarOpen(false);
  }, []);

  const handleTaskSave = useCallback((id: string, updates: Partial<Task>) => {
    editTask(id, updates);
    setSelectedTaskId(null);
  }, [editTask]);

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

  // Search filter
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 animate-slideUp" onClick={e => e.stopPropagation()}>
            <Sidebar
              stats={stats}
              onRefresh={refresh}
              onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          stats={stats}
          onRefresh={refresh}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 relative">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 sm:hidden" />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hidden sm:block" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-slate-50"
            />
          </div>
          {/* Date - hidden on smallest screens */}
          <div className="text-xs sm:text-sm text-slate-400 flex-shrink-0 hidden xs:block">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </header>

        {/* Task list */}
        <TaskList
          tasks={filteredTasks}
          onToggle={toggleStatus}
          onTaskClick={handleTaskClick}
        />

        {/* FAB */}
        <button
          onClick={() => setCaptureOpen(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-13 h-13 sm:w-14 sm:h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95 z-40"
          title="快速录入任务"
        >
          <Plus size={26} className="sm:w-7 sm:h-7" />
        </button>
      </main>

      {/* Modals */}
      <CaptureModal
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        settings={settings}
        onTasksCreated={handleTasksCreated}
      />

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onSave={handleTaskSave}
          onDelete={removeTask}
        />
      )}

      <SettingsPanel
        isOpen={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;

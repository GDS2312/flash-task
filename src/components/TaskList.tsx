import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { ClipboardList, Filter } from 'lucide-react';
import { useState } from 'react';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onTaskClick: (id: string) => void;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

export function TaskList({ tasks, onToggle, onTaskClick }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');

  // Apply filters
  let filtered = tasks;
  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(t => t.priority === priorityFilter);
  }

  // Apply sort
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Completed tasks at bottom
  const active = filtered.filter(t => t.status !== 'completed');
  const completed = filtered.filter(t => t.status === 'completed');
  const sorted = [...active, ...completed];

  return (
    <div className="flex-1 overflow-auto">
      {/* Filters */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-slate-400" />

        {/* Status filter */}
        <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待办' },
            { key: 'in_progress', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as FilterStatus)}
              className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
                statusFilter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {[
            { key: 'all', label: '全部优先级' },
            { key: 'high', label: '高' },
            { key: 'medium', label: '中' },
            { key: 'low', label: '低' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPriorityFilter(key as FilterPriority)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                priorityFilter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600"
          >
            <option value="priority">优先级</option>
            <option value="dueDate">截止日期</option>
            <option value="created">创建时间</option>
          </select>
          <span className="text-xs text-slate-400 ml-2">
            {sorted.length} 项任务
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="p-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ClipboardList size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无任务</p>
            <p className="text-sm mt-1">点击右下角 + 按钮，用语音、图片或文字快速创建任务</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onClick={onTaskClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

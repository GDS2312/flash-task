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
      {/* Filters - scrollable on mobile */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm px-3 sm:px-6 py-2.5 border-b border-slate-100">
        {/* Top row: status + priority filters - scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <Filter size={14} className="text-slate-400 flex-shrink-0 hidden sm:block" />

          {/* Status filter */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待办' },
              { key: 'in_progress', label: '进行中' },
              { key: 'completed', label: '已完成' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as FilterStatus)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                  statusFilter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
            {[
              { key: 'all', label: '全部优先级' },
              { key: 'high', label: '🔴' },
              { key: 'medium', label: '🟡' },
              { key: 'low', label: '⚪' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPriorityFilter(key as FilterPriority)}
                className={`px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                  priorityFilter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row: sort + count */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600"
          >
            <option value="priority">优先级</option>
            <option value="dueDate">截止日期</option>
            <option value="created">创建时间</option>
          </select>
          <span className="ml-auto">{sorted.length} 项任务</span>
        </div>
      </div>

      {/* Task list */}
      <div className="p-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-6">
              <ClipboardList size={36} className="text-primary/30 sm:w-12 sm:h-12" />
            </div>
            <p className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">开始你的第一条任务</p>
            <p className="text-sm text-slate-400 max-w-xs mb-8">
              点击右下角 <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white rounded-lg text-xs font-bold mx-0.5 align-middle">+</span> 按钮，三种方式快速创建：
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md w-full">
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-primary/30 transition-colors cursor-default">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🎙️</span>
                </div>
                <p className="text-sm font-medium text-slate-700">语音录入</p>
                <p className="text-xs text-slate-400 mt-1">说话即创建</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-primary/30 transition-colors cursor-default">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">📷</span>
                </div>
                <p className="text-sm font-medium text-slate-700">图片识别</p>
                <p className="text-xs text-slate-400 mt-1">拍照转任务</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-primary/30 transition-colors cursor-default">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">⌨️</span>
                </div>
                <p className="text-sm font-medium text-slate-700">文字输入</p>
                <p className="text-xs text-slate-400 mt-1">粘贴即提取</p>
              </div>
            </div>
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

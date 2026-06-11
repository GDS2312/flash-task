import type { Task } from '../types';
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Play, Mic, Image, FileText, Tag } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
}

const priorityConfig = {
  high: { color: 'text-red-500 bg-red-50', icon: AlertCircle, label: '高' },
  medium: { color: 'text-amber-500 bg-amber-50', icon: AlertCircle, label: '中' },
  low: { color: 'text-slate-400 bg-slate-50', icon: AlertCircle, label: '低' },
};

const sourceIcons = {
  voice: Mic,
  image: Image,
  text: FileText,
};

const sourceLabels = {
  voice: '语音',
  image: '图片',
  text: '文字',
};

export function TaskCard({ task, onToggle, onClick }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const prio = priorityConfig[task.priority];
  const SourceIcon = sourceIcons[task.source.type];

  const isOverdue = !isCompleted && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <div
      className={`group bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md animate-fadeIn ${
        isCompleted ? 'opacity-60 border-slate-100' :
        isOverdue ? 'border-red-200 bg-red-50/30' :
        'border-slate-200 hover:border-primary/30'
      }`}
      onClick={() => onClick(task.id)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`mt-0.5 flex-shrink-0 transition-colors ${
            isCompleted ? 'text-success' : 'text-slate-300 hover:text-primary'
          }`}
        >
          {isCompleted ? <CheckCircle2 size={22} /> : isInProgress ? <Play size={22} className="text-primary" /> : <Circle size={22} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.title}
            </h3>
            {/* Priority badge */}
            <span className={`flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${prio.color}`}>
              <prio.icon size={10} />
              {prio.label}
            </span>
          </div>

          {task.description && task.description !== task.title && (
            <p className="text-sm text-slate-500 truncate mb-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {/* Due date */}
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-xs ${
                isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'
              }`}>
                <Calendar size={12} />
                {task.dueDate.slice(5)}
                {task.dueTime && (
                  <>
                    <Clock size={12} className="ml-1" />
                    {task.dueTime}
                  </>
                )}
                {isOverdue && <span className="text-red-500">(已逾期)</span>}
              </span>
            )}

            {/* Source */}
            <span className="inline-flex items-center gap-1 text-xs text-slate-400" title={sourceLabels[task.source.type] + '录入'}>
              <SourceIcon size={12} />
            </span>

            {/* Tags */}
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                <Tag size={10} />
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-slate-400">+{task.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

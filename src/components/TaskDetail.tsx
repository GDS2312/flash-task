import { useState } from 'react';
import type { Task, Priority } from '../types';
import { X, Calendar, Clock, Tag, Trash2, Save, Mic, Image, FileText, Bell, BellOff } from 'lucide-react';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

const sourceIcons = { voice: Mic, image: Image, text: FileText };
const sourceLabels = { voice: '语音录入', image: '图片录入', text: '文字录入' };

export function TaskDetail({ task, onClose, onSave, onDelete }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '');
  const [tags, setTags] = useState(task.tags.join(', '));
  const [reminderEnabled, setReminderEnabled] = useState(task.reminder.enabled);
  const [saving, setSaving] = useState(false);

  const SourceIcon = sourceIcons[task.source.type];

  const handleSave = async () => {
    setSaving(true);
    const updates: Partial<Task> = {
      title,
      description,
      priority,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      reminder: {
        enabled: reminderEnabled,
        time: reminderEnabled ? (dueDate ? `${dueDate}T${dueTime || '09:00'}:00` : null) : null,
      },
    };
    // Small delay for UX
    await new Promise(r => setTimeout(r, 200));
    onSave(task.id, updates);
    setSaving(false);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <SourceIcon size={12} />
              {sourceLabels[task.source.type]}
            </span>
            <span className="text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">任务标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-medium text-slate-800 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="输入任务标题..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              placeholder="任务详情..."
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">优先级</label>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                {[
                  { key: 'high', label: '🔴 高' },
                  { key: 'medium', label: '🟡 中' },
                  { key: 'low', label: '⚪ 低' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPriority(key as Priority)}
                    className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                      priority === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">提醒</label>
              <button
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-full flex items-center justify-center gap-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  reminderEnabled
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {reminderEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                {reminderEnabled ? '已开启' : '已关闭'}
              </button>
            </div>
          </div>

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <Calendar size={12} className="inline mr-1" />截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <Clock size={12} className="inline mr-1" />截止时间
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              <Tag size={12} className="inline mr-1" />标签（逗号分隔）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="开会, 重要, 项目A..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            删除
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save size={16} />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

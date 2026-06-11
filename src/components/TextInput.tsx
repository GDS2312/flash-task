import { useState } from 'react';
import type { AppSettings, Task } from '../types';
import { createTask } from '../store';
import { extractTasks } from '../ai-engine';
import { Sparkles, Loader2, Check, FileText } from 'lucide-react';

interface TextInputProps {
  settings: AppSettings;
  onTasksCreated: (tasks: Task[]) => void;
}

export function TextInput({ settings, onTasksCreated }: TextInputProps) {
  const [text, setText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [created, setCreated] = useState(false);
  const [method, setMethod] = useState<'ai' | 'manual'>('ai');

  const handleExtract = async () => {
    if (!text.trim()) return;

    setIsExtracting(true);
    try {
      const items = await extractTasks(text, settings);
      const tasks = items.map(item => createTask({
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: 'pending',
        dueDate: item.dueDate,
        dueTime: null,
        tags: item.tags,
        source: {
          type: 'text',
          content: text,
          timestamp: new Date().toISOString(),
        },
        reminder: { enabled: false, time: null },
      }));
      setExtractedTasks(tasks);
    } catch {
      const task = createTask({
        title: text.split(/[。！？\n]/)[0].slice(0, 50),
        description: text,
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        dueTime: null,
        tags: [],
        source: { type: 'text', content: text, timestamp: new Date().toISOString() },
        reminder: { enabled: false, time: null },
      });
      setExtractedTasks([task]);
    }
    setIsExtracting(false);
  };

  const handleManualAdd = () => {
    if (!text.trim()) return;
    const task = createTask({
      title: text.trim(),
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: null,
      dueTime: null,
      tags: [],
      source: { type: 'text', content: text, timestamp: new Date().toISOString() },
      reminder: { enabled: false, time: null },
    });
    onTasksCreated([task]);
    setText('');
  };

  const handleConfirm = () => {
    onTasksCreated(extractedTasks);
    setCreated(true);
    setTimeout(() => {
      setText('');
      setExtractedTasks([]);
      setCreated(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {created ? (
        <div className="text-center py-10 animate-fadeIn">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-success" />
          </div>
          <p className="text-lg font-medium text-slate-800">已创建 {extractedTasks.length} 个任务！</p>
          <p className="text-sm text-slate-400 mt-1">可在任务列表中查看和编辑</p>
        </div>
      ) : (
        <>
          {/* Mode switch */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setMethod('ai')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                method === 'ai' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Sparkles size={12} className="inline mr-1" />
              AI 智能提取
            </button>
            <button
              onClick={() => setMethod('manual')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                method === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              <FileText size={12} className="inline mr-1" />
              直接添加
            </button>
          </div>

          {/* Text input */}
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              placeholder={
                method === 'ai'
                  ? '输入你的笔记内容，AI 将自动提取任务...\n\n例如：\n明天下午3点跟张工开会讨论AI平台方案，需要提前准备PPT。\n周五前完成服务器采购，优先级很高。\n记得联系李总确认下周出差安排。'
                  : '输入任务标题，回车直接添加...'
              }
              onKeyDown={(e) => {
                if (method === 'manual' && e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleManualAdd();
                }
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {method === 'ai' ? (
              <button
                onClick={handleExtract}
                disabled={!text.trim() || isExtracting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    正在提取任务...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    AI 智能提取任务
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleManualAdd}
                disabled={!text.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加任务
              </button>
            )}
          </div>

          {/* Extracted tasks */}
          {extractedTasks.length > 0 && (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  识别到 <span className="text-primary">{extractedTasks.length}</span> 个任务
                </p>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  <Check size={16} />
                  全部添加到列表
                </button>
              </div>
              {extractedTasks.map((task, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-400'
                  }`} />
                  <span className="text-slate-700 flex-1 truncate">{task.title}</span>
                  {task.dueDate && <span className="text-xs text-slate-400">{task.dueDate.slice(5)}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

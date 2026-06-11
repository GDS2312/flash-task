import type { TaskStats } from '../types';
import { ListTodo, Clock, CheckCircle2, AlertTriangle, Calendar, Settings, Download, Upload, Zap } from 'lucide-react';
import { useRef } from 'react';
import { exportAllData, importAllData } from '../store';

interface SidebarProps {
  stats: TaskStats;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ stats, onRefresh, onOpenSettings }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashtask-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ok = importAllData(text);
      if (ok) {
        alert('数据导入成功！');
        onRefresh();
      } else {
        alert('数据导入失败，请检查文件格式');
      }
    } catch {
      alert('文件读取失败');
    }
  };

  const statItems = [
    { icon: ListTodo, label: '全部任务', value: stats.total, color: 'text-slate-600' },
    { icon: Clock, label: '待处理', value: stats.pending, color: 'text-primary' },
    { icon: AlertTriangle, label: '已逾期', value: stats.overdue, color: 'text-red-500' },
    { icon: Calendar, label: '今日任务', value: stats.todayCount, color: 'text-amber-500' },
    { icon: CheckCircle2, label: '已完成', value: stats.completed, color: 'text-success' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">闪记任务</h1>
            <p className="text-xs text-slate-400">AI 多模态任务助手</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">任务统计</p>
        <div className="space-y-1">
          {statItems.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Icon size={16} className={color} />
                <span className="text-sm text-slate-600">{label}</span>
              </div>
              <span className={`text-sm font-semibold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-slate-100 space-y-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">数据管理</p>
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Download size={16} />
          导出备份
        </button>
        <button
          onClick={handleImport}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Upload size={16} />
          导入数据
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Settings */}
      <div className="mt-auto p-4 border-t border-slate-100">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Settings size={16} />
          设置
        </button>
        <p className="text-xs text-slate-300 text-center mt-3">FlashTask v1.0</p>
      </div>
    </aside>
  );
}

import { useState } from 'react';
import { X, Mic, Image, FileText } from 'lucide-react';
import type { AppSettings, Task } from '../types';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { TextInput } from './TextInput';

type CaptureTab = 'voice' | 'image' | 'text';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onTasksCreated: (tasks: Task[]) => void;
}

const tabs: { key: CaptureTab; label: string; icon: typeof Mic }[] = [
  { key: 'voice', label: '语音录入', icon: Mic },
  { key: 'image', label: '图片识别', icon: Image },
  { key: 'text', label: '文字输入', icon: FileText },
];

export function CaptureModal({ isOpen, onClose, settings, onTasksCreated }: CaptureModalProps) {
  const [activeTab, setActiveTab] = useState<CaptureTab>('voice');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:items-start md:justify-center md:pt-16 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white md:rounded-2xl shadow-2xl w-full md:max-w-lg md:mx-4 animate-slideUp h-full md:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">快速录入</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-auto flex-1">
          {activeTab === 'voice' && (
            <VoiceRecorder settings={settings} onTasksCreated={onTasksCreated} />
          )}
          {activeTab === 'image' && (
            <ImageUploader settings={settings} onTasksCreated={onTasksCreated} />
          )}
          {activeTab === 'text' && (
            <TextInput settings={settings} onTasksCreated={onTasksCreated} />
          )}
        </div>
      </div>
    </div>
  );
}

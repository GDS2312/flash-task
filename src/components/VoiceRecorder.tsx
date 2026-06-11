import { useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { extractTasks } from '../ai-engine';
import type { AppSettings, Task } from '../types';
import { createTask } from '../store';
import { Mic, Square, RefreshCw, Sparkles, Loader2, Check, AlertTriangle } from 'lucide-react';

interface VoiceRecorderProps {
  settings: AppSettings;
  onTasksCreated: (tasks: Task[]) => void;
}

export function VoiceRecorder({ settings, onTasksCreated }: VoiceRecorderProps) {
  const { isListening, transcript, interimTranscript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [created, setCreated] = useState(false);

  // Extract tasks when transcript is final
  const handleExtract = async () => {
    const text = transcript.trim();
    if (!text) return;

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
          type: 'voice',
          content: text,
          timestamp: new Date().toISOString(),
        },
        reminder: {
          enabled: false,
          time: null,
        },
      }));
      setExtractedTasks(tasks);
    } catch {
      // Fallback: create single task from full text
      const task = createTask({
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        dueTime: null,
        tags: [],
        source: {
          type: 'voice',
          content: text,
          timestamp: new Date().toISOString(),
        },
        reminder: { enabled: false, time: null },
      });
      setExtractedTasks([task]);
    }
    setIsExtracting(false);
  };

  const handleConfirm = () => {
    onTasksCreated(extractedTasks);
    setCreated(true);
    setTimeout(() => {
      resetTranscript();
      setExtractedTasks([]);
      setCreated(false);
    }, 1500);
  };

  const handleReset = () => {
    resetTranscript();
    setExtractedTasks([]);
    setCreated(false);
  };

  if (!isSupported) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
        <p className="text-slate-600 font-medium">浏览器不支持语音识别</p>
        <p className="text-sm text-slate-400 mt-1">请使用 Chrome 浏览器打开此功能</p>
      </div>
    );
  }

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
          {/* Recording area */}
          <div className={`relative rounded-xl border-2 p-6 text-center transition-all ${
            isListening
              ? 'border-red-300 bg-red-50/50'
              : transcript
                ? 'border-slate-200 bg-slate-50/50'
                : 'border-dashed border-slate-300 bg-white hover:border-primary/30'
          }`}>
            {/* Waveform animation when recording */}
            {isListening && (
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-recording" />
                <span className="text-xs text-red-500 font-medium">录音中</span>
              </div>
            )}

            {/* Display text */}
            {transcript || interimTranscript ? (
              <div className="text-left space-y-1 mb-4">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-slate-400 italic">{interimTranscript}</span>
                  )}
                </p>
                {isListening && <span className="inline-block w-1 h-4 bg-primary animate-pulse-recording align-middle ml-0.5" />}
              </div>
            ) : (
              <div className="py-6 text-slate-400">
                <Mic size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {isListening ? '正在聆听...' : '点击下方按钮开始录音，说出你的任务'}
                </p>
              </div>
            )}

            {/* Record button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
              }`}
            >
              {isListening ? <Square size={18} /> : <Mic size={18} />}
              {isListening ? '停止录音' : '开始录音'}
            </button>
          </div>

          {/* Action buttons */}
          {transcript.trim() && !isListening && (
            <div className="flex gap-3 animate-fadeIn">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} />
                重新录入
              </button>
              <button
                onClick={handleExtract}
                disabled={isExtracting}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    正在提取任务...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    AI 提取任务
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted tasks preview */}
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
              <div className="max-h-48 overflow-auto space-y-1.5">
                {extractedTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-400'
                    }`} />
                    <span className="text-slate-700 flex-1 truncate">{task.title}</span>
                    {task.dueDate && (
                      <span className="text-xs text-slate-400">{task.dueDate.slice(5)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

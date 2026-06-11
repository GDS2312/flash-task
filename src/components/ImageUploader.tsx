import { useState, useRef, useCallback } from 'react';
import type { AppSettings, Task } from '../types';
import { createTask } from '../store';
import { extractTasks, analyzeImageContent } from '../ai-engine';
import { Upload, Sparkles, Loader2, Check, X } from 'lucide-react';

interface ImageUploaderProps {
  settings: AppSettings;
  onTasksCreated: (tasks: Task[]) => void;
}

export function ImageUploader({ settings, onTasksCreated }: ImageUploaderProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageText, setImageText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [created, setCreated] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
      setImageText('');
      setExtractedTasks([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!imageData) return;
    setIsAnalyzing(true);
    try {
      const text = await analyzeImageContent(imageData, settings);
      setImageText(text);
    } catch {
      setImageText('（图片分析失败，请手动输入图片中的任务内容）');
    }
    setIsAnalyzing(false);
  };

  const handleExtract = async () => {
    const text = imageText.trim();
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
          type: 'image',
          content: imageData || '',
          timestamp: new Date().toISOString(),
        },
        reminder: { enabled: false, time: null },
      }));
      setExtractedTasks(tasks);
    } catch {
      const task = createTask({
        title: text.slice(0, 50),
        description: text,
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        dueTime: null,
        tags: [],
        source: {
          type: 'image',
          content: imageData || '',
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
      setImageData(null);
      setImageText('');
      setExtractedTasks([]);
      setCreated(false);
    }, 1500);
  };

  const handleReset = () => {
    setImageData(null);
    setImageText('');
    setExtractedTasks([]);
    setCreated(false);
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
          {/* Upload area */}
          {!imageData ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/30 hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-600 font-medium">点击或拖拽上传图片</p>
              <p className="text-sm text-slate-400 mt-1">
                支持白板、笔记、便签、会议纪要、聊天截图等
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          ) : (
            <div className="space-y-3 animate-fadeIn">
              {/* Image preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={imageData} alt="Uploaded" className="w-full max-h-64 object-contain bg-slate-50" />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Analyze button (for LLM mode) */}
              {settings.aiMode === 'llm' && !imageText && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      正在识别图片内容...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      AI 识别图片内容
                    </>
                  )}
                </button>
              )}

              {/* Text input area for image content */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  图片中的文字内容
                </label>
                <textarea
                  value={imageText}
                  onChange={(e) => setImageText(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder={
                    settings.aiMode === 'llm'
                      ? '点击上方按钮自动识别，或手动输入图片中的任务内容...'
                      : '请手动输入图片中的任务内容，例如：\n- 周五前完成PPT\n- 联系张工确认方案\n- 采购3台服务器...'
                  }
                />
              </div>

              {/* Extract button */}
              {imageText.trim() && (
                <div className="flex gap-3 animate-fadeIn">
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
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
            </div>
          )}

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

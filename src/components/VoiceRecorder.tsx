import { useState, useRef, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { extractTasks } from '../ai-engine';
import type { AppSettings, Task } from '../types';
import { createTask } from '../store';
import { Mic, Square, Sparkles, Loader2, Check, Play, Pause, RefreshCw } from 'lucide-react';

interface VoiceRecorderProps {
  settings: AppSettings;
  onTasksCreated: (tasks: Task[]) => void;
}

export function VoiceRecorder({ settings, onTasksCreated }: VoiceRecorderProps) {
  // ---- Web Speech API (Chrome desktop) ----
  const speech = useSpeechRecognition();
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [created, setCreated] = useState(false);

  // ---- MediaRecorder fallback (mobile / Safari) ----
  const [mediaRecording, setMediaRecording] = useState(false);
  const [mediaAudioUrl, setMediaAudioUrl] = useState<string | null>(null);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [mediaText, setMediaText] = useState('');
  const [mediaDuration, setMediaDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const isSpeechSupported = speech.isSupported;

  // ---- MediaRecorder: start recording ----
  const startMediaRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setMediaAudioUrl(url);
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        if (mediaTimerRef.current) clearInterval(mediaTimerRef.current);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setMediaRecording(true);
      setMediaDuration(0);
      setMediaAudioUrl(null);
      setMediaText('');
      // Duration timer
      mediaTimerRef.current = setInterval(() => {
        setMediaDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      alert('无法访问麦克风，请检查浏览器权限设置');
    }
  }, []);

  // ---- MediaRecorder: stop recording ----
  const stopMediaRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setMediaRecording(false);
    if (mediaTimerRef.current) clearInterval(mediaTimerRef.current);
  }, []);

  // ---- MediaRecorder: play/pause audio ----
  const togglePlayback = useCallback(() => {
    if (!audioPlayerRef.current) return;
    if (mediaPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setMediaPlaying(!mediaPlaying);
  }, [mediaPlaying]);

  // ---- MediaRecorder: transcribe via LLM ----
  const transcribeAudio = useCallback(async () => {
    if (!mediaAudioUrl || settings.aiMode !== 'llm' || !settings.llmEndpoint) return;
    // For now: convert audio to base64 and send to a multimodal LLM
    try {
      const response = await fetch(mediaAudioUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;

      const apiResponse = await fetch(settings.llmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.llmApiKey}`,
        },
        body: JSON.stringify({
          model: settings.llmModel,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '请将这段音频内容转写为文字，只输出转写结果。' },
              { type: 'input_audio', input_audio: { data: base64.split(',')[1], format: 'webm' } },
            ],
          }],
        }),
      });
      const data = await apiResponse.json();
      const content = data.choices?.[0]?.message?.content || '';
      setMediaText(content);
    } catch (err) {
      console.warn('Audio transcription failed:', err);
      alert('音频转写失败，请手动输入录音内容');
    }
  }, [mediaAudioUrl, settings]);

  // ---- Web Speech: extract tasks ----
  const handleSpeechExtract = async () => {
    const text = speech.transcript.trim();
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
        source: { type: 'voice', content: text, timestamp: new Date().toISOString() },
        reminder: { enabled: false, time: null },
      }));
      setExtractedTasks(tasks);
    } catch {
      const task = createTask({
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        priority: 'medium',
        status: 'pending',
        dueDate: null, dueTime: null, tags: [],
        source: { type: 'voice', content: text, timestamp: new Date().toISOString() },
        reminder: { enabled: false, time: null },
      });
      setExtractedTasks([task]);
    }
    setIsExtracting(false);
  };

  // ---- MediaRecorder: extract tasks from typed text ----
  const handleMediaExtract = async () => {
    const text = mediaText.trim();
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
        source: { type: 'voice', content: text, timestamp: new Date().toISOString() },
        reminder: { enabled: false, time: null },
      }));
      setExtractedTasks(tasks);
    } catch {
      const task = createTask({
        title: text.slice(0, 50),
        description: text,
        priority: 'medium',
        status: 'pending',
        dueDate: null, dueTime: null, tags: [],
        source: { type: 'voice', content: text, timestamp: new Date().toISOString() },
        reminder: { enabled: false, time: null },
      });
      setExtractedTasks([task]);
    }
    setIsExtracting(false);
  };

  // ---- Common: confirm tasks ----
  const handleConfirm = () => {
    onTasksCreated(extractedTasks);
    setCreated(true);
    setTimeout(() => {
      speech.resetTranscript();
      setExtractedTasks([]);
      setCreated(false);
      setMediaAudioUrl(null);
      setMediaText('');
    }, 1500);
  };

  // ---- Common: reset ----
  const handleReset = () => {
    speech.resetTranscript();
    setExtractedTasks([]);
    setCreated(false);
    setMediaAudioUrl(null);
    setMediaText('');
  };

  // Format duration
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ---- Render ----
  if (created) {
    return (
      <div className="text-center py-10 animate-fadeIn">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-success" />
        </div>
        <p className="text-lg font-medium text-slate-800">已创建 {extractedTasks.length} 个任务！</p>
        <p className="text-sm text-slate-400 mt-1">可在任务列表中查看和编辑</p>
      </div>
    );
  }

  // ============ Web Speech API Mode (Chrome Desktop) ============
  if (isSpeechSupported) {
    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-success rounded-full" />
          实时语音识别模式 (Web Speech API)
        </div>

        {/* Recording area */}
        <div className={`relative rounded-xl border-2 p-6 text-center transition-all ${
          speech.isListening
            ? 'border-red-300 bg-red-50/50'
            : speech.transcript
              ? 'border-slate-200 bg-slate-50/50'
              : 'border-dashed border-slate-300 bg-white hover:border-primary/30'
        }`}>
          {speech.isListening && (
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-recording" />
              <span className="text-xs text-red-500 font-medium">录音中</span>
            </div>
          )}

          {speech.transcript || speech.interimTranscript ? (
            <div className="text-left space-y-1 mb-4">
              <p className="text-slate-700 text-sm leading-relaxed">
                {speech.transcript}
                {speech.interimTranscript && (
                  <span className="text-slate-400 italic">{speech.interimTranscript}</span>
                )}
              </p>
              {speech.isListening && <span className="inline-block w-1 h-4 bg-primary animate-pulse-recording align-middle ml-0.5" />}
            </div>
          ) : (
            <div className="py-6 text-slate-400">
              <Mic size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {speech.isListening ? '正在聆听...' : '点击下方按钮开始录音，说出你的任务'}
              </p>
            </div>
          )}

          <button
            onClick={speech.isListening ? speech.stopListening : speech.startListening}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all ${
              speech.isListening
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200'
                : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
            }`}
          >
            {speech.isListening ? <Square size={18} /> : <Mic size={18} />}
            {speech.isListening ? '停止录音' : '开始录音'}
          </button>
        </div>

        {/* Action buttons */}
        {speech.transcript.trim() && !speech.isListening && (
          <div className="flex gap-3 animate-fadeIn">
            <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              <RefreshCw size={16} /> 重新录入
            </button>
            <button onClick={handleSpeechExtract} disabled={isExtracting}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
              {isExtracting ? (
                <><Loader2 size={16} className="animate-spin" /> 正在提取任务...</>
              ) : (
                <><Sparkles size={16} /> AI 提取任务</>
              )}
            </button>
          </div>
        )}

        {/* Extracted tasks */}
        {extractedTasks.length > 0 && <TaskPreview tasks={extractedTasks} onConfirm={handleConfirm} />}
      </div>
    );
  }

  // ============ MediaRecorder Mode (Mobile / Safari) ============
  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        音频录制模式 — 录制后手动输入或AI转写
      </div>

      {/* Recording area */}
      <div className={`relative rounded-xl border-2 p-6 text-center transition-all ${
        mediaRecording
          ? 'border-red-300 bg-red-50/50'
          : mediaAudioUrl
            ? 'border-slate-200 bg-slate-50/50'
            : 'border-dashed border-slate-300 bg-white hover:border-primary/30'
      }`}>
        {mediaRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-recording" />
            <span className="text-xs text-red-500 font-medium">录音中 {formatDuration(mediaDuration)}</span>
          </div>
        )}

        {mediaAudioUrl ? (
          <div className="space-y-3 mb-4">
            {/* Audio player */}
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
              <button
                onClick={togglePlayback}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
              >
                {mediaPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary/30 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-xs text-slate-400">{formatDuration(mediaDuration)}</span>
            </div>
            <audio
              ref={audioPlayerRef}
              src={mediaAudioUrl}
              onEnded={() => setMediaPlaying(false)}
              onPlay={() => setMediaPlaying(true)}
              onPause={() => setMediaPlaying(false)}
              className="hidden"
            />
            <p className="text-xs text-slate-400">录音已保存，点击播放按钮收听</p>
          </div>
        ) : (
          <div className="py-6 text-slate-400">
            <Mic size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {mediaRecording ? `正在录音 ${formatDuration(mediaDuration)}...` : '点击按钮开始录音'}
            </p>
            <p className="text-xs mt-2 text-slate-300">移动端 / Safari 使用音频录制模式</p>
          </div>
        )}

        <button
          onClick={mediaRecording ? stopMediaRecording : startMediaRecording}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all ${
            mediaRecording
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200'
              : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
          }`}
        >
          {mediaRecording ? <Square size={18} /> : <Mic size={18} />}
          {mediaRecording ? '停止录音' : mediaAudioUrl ? '重新录制' : '开始录音'}
        </button>
      </div>

      {/* After recording: text input + actions */}
      {mediaAudioUrl && (
        <div className="space-y-3 animate-fadeIn">
          {/* Text input */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              录音内容（播放录音后手动输入，或使用AI转写）
            </label>
            <textarea
              value={mediaText}
              onChange={(e) => setMediaText(e.target.value)}
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              placeholder="听完录音后，在这里输入任务内容...&#10;例如：明天下午开会讨论方案，需要准备PPT"
            />
          </div>

          <div className="flex gap-3">
            {settings.aiMode === 'llm' && settings.llmEndpoint && (
              <button
                onClick={transcribeAudio}
                className="flex items-center gap-2 px-4 py-2.5 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                <Sparkles size={16} /> AI 语音转文字
              </button>
            )}
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              <RefreshCw size={16} /> 重新录制
            </button>
            <button
              onClick={handleMediaExtract}
              disabled={!mediaText.trim() || isExtracting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isExtracting ? (
                <><Loader2 size={16} className="animate-spin" /> 正在提取...</>
              ) : (
                <><Sparkles size={16} /> AI 提取任务</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Extracted tasks */}
      {extractedTasks.length > 0 && <TaskPreview tasks={extractedTasks} onConfirm={handleConfirm} />}
    </div>
  );
}

// ---- Shared task preview component ----
function TaskPreview({ tasks, onConfirm }: { tasks: Task[]; onConfirm: () => void }) {
  return (
    <div className="space-y-2 animate-fadeIn">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">
          识别到 <span className="text-primary">{tasks.length}</span> 个任务
        </p>
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <Check size={16} />
          全部添加到列表
        </button>
      </div>
      <div className="max-h-48 overflow-auto space-y-1.5">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${
              task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-400'
            }`} />
            <span className="text-slate-700 flex-1 truncate">{task.title}</span>
            {task.dueDate && <span className="text-xs text-slate-400">{task.dueDate.slice(5)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { AppSettings } from '../types';
import { X, Save, Bell, Brain, Cog } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export function SettingsPanel({ isOpen, settings, onClose, onSave }: SettingsPanelProps) {
  const [aiMode, setAiMode] = useState(settings.aiMode);
  const [llmEndpoint, setLlmEndpoint] = useState(settings.llmEndpoint);
  const [llmApiKey, setLlmApiKey] = useState(settings.llmApiKey);
  const [llmModel, setLlmModel] = useState(settings.llmModel);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [defaultReminderMinutes, setDefaultReminderMinutes] = useState(settings.defaultReminderMinutes);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      aiMode,
      llmEndpoint,
      llmApiKey,
      llmModel,
      notificationsEnabled,
      defaultReminderMinutes,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cog size={20} className="text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-800">设置</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* AI Mode */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-slate-700">AI 引擎配置</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">提取模式</label>
                <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setAiMode('rule')}
                    className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
                      aiMode === 'rule' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    规则引擎
                  </button>
                  <button
                    onClick={() => setAiMode('llm')}
                    className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
                      aiMode === 'llm' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    LLM 大模型
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {aiMode === 'rule'
                    ? '基于规则匹配，无需联网，处理快速'
                    : '使用大语言模型，识别更准确，支持图片内容分析'}
                </p>
              </div>

              {aiMode === 'llm' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">API 地址</label>
                    <input
                      type="text"
                      value={llmEndpoint}
                      onChange={(e) => setLlmEndpoint(e.target.value)}
                      placeholder="https://api.openai.com/v1/chat/completions"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">API Key</label>
                    <input
                      type="password"
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">模型名称</label>
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    />
                    <p className="text-xs text-slate-400 mt-1">支持 OpenAI 兼容 API，也可接入企业内部模型服务</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">通知提醒</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">浏览器通知</p>
                  <p className="text-xs text-slate-400">任务到期时发送桌面通知</p>
                </div>
                <button
                  onClick={() => {
                    if (!notificationsEnabled && ('Notification' in window) && Notification.permission !== 'granted') {
                      handleRequestNotification();
                    } else {
                      setNotificationsEnabled(!notificationsEnabled);
                    }
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  默认提前提醒时间
                </label>
                <select
                  value={defaultReminderMinutes}
                  onChange={(e) => setDefaultReminderMinutes(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value={5}>5 分钟前</option>
                  <option value={15}>15 分钟前</option>
                  <option value={30}>30 分钟前</option>
                  <option value={60}>1 小时前</option>
                  <option value={1440}>1 天前</option>
                </select>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-600">闪记任务 FlashTask v1.0</strong><br />
              多模态 AI 任务助手 — 语音/图片/文字一键转任务清单<br />
              数据完全存储在浏览器本地，不上传任何服务器
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-5 py-2 text-sm rounded-lg font-medium transition-all text-white ${
              saved ? 'bg-success' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            <Save size={16} />
            {saved ? '已保存 ✓' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}

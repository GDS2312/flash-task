export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type SourceType = 'voice' | 'image' | 'text';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;       // ISO date string
  dueTime: string | null;       // HH:mm
  tags: string[];
  source: {
    type: SourceType;
    content: string;            // transcription text / image data URL / original text
    timestamp: string;
  };
  reminder: {
    enabled: boolean;
    time: string | null;        // ISO datetime string
  };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Note {
  id: string;
  type: SourceType;
  content: string;              // text or image data URL
  rawText: string;              // transcribed/extracted text
  taskIds: string[];
  createdAt: string;
}

export interface AppSettings {
  aiMode: 'rule' | 'llm';
  llmEndpoint: string;
  llmApiKey: string;
  llmModel: string;
  notificationsEnabled: boolean;
  defaultReminderMinutes: number;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  todayCount: number;
}

export type EisenhowerQuadrant = 'do-first' | 'schedule' | 'delegate' | 'eliminate';

export interface Task {
  id: string;
  title: string;
  quadrant: EisenhowerQuadrant;
  deadline?: string;       // ISO date string, e.g. "2026-07-01"
  effortMinutes?: number;
  isDelegatable: boolean;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  googleEventId?: string;  // set when a calendar event is linked
}

export interface IntakeMessage {
  role: 'assistant' | 'user';
  content: string;
}

export interface ExtractedTask {
  title: string;
  quadrant: EisenhowerQuadrant;
  deadline?: string;
  effortMinutes?: number;
  isDelegatable: boolean;
  notes?: string;
}

export interface ReminderSettings {
  morningEnabled: boolean;
  morningHour: number;
  morningMinute: number;
  afternoonEnabled: boolean;
  afternoonHour: number;
  afternoonMinute: number;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  morningEnabled: true,
  morningHour: 8,
  morningMinute: 0,
  afternoonEnabled: true,
  afternoonHour: 13,
  afternoonMinute: 0,
};

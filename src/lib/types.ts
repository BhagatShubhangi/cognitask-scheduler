export type Priority = 'high' | 'medium' | 'low';
export type Effort = 'light' | 'moderate' | 'intense';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | '';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type TaskStatus = 'not-started' | 'in-progress' | 'done';

export interface Task {
  id: string;
  name: string;
  priority: Priority;
  duration: number;
  effort: Effort;
  preferredTime: TimeOfDay;
  dueDay: DayOfWeek;
  status: TaskStatus;
  scheduledHour?: number;
  isFixed?: boolean;
  fixedHour?: number;
}

export const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8AM - 10PM

import { Task, DayOfWeek, HOURS, Priority, Effort } from './types';

const TASKS_KEY = 'cognitask_tasks';
const WEEK_KEY = 'cognitask_week';
const PATTERNS_KEY = 'cognitask_patterns';

export function getTasks(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getCurrentWeek(): number {
  const raw = localStorage.getItem(WEEK_KEY);
  return raw ? parseInt(raw) : 1;
}

export function setCurrentWeek(week: number) {
  localStorage.setItem(WEEK_KEY, String(week));
}

interface PatternEntry {
  priority: Priority;
  effort: Effort;
  hour: number;
  completed: boolean;
}

export function getPatterns(): PatternEntry[] {
  const raw = localStorage.getItem(PATTERNS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function savePattern(entry: PatternEntry) {
  const patterns = getPatterns();
  patterns.push(entry);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
}

function getPreferredHourRange(time: string): number[] {
  if (time === 'morning') return HOURS.filter(h => h >= 8 && h < 12);
  if (time === 'afternoon') return HOURS.filter(h => h >= 12 && h < 17);
  if (time === 'evening') return HOURS.filter(h => h >= 17 && h < 21);
  return HOURS;
}

function getPriorityWeight(p: Priority): number {
  return p === 'high' ? 3 : p === 'medium' ? 2 : 1;
}

function canFitTask(occupied: Set<number>, hour: number, duration: number): boolean {
  for (let i = 0; i < Math.ceil(duration); i++) {
    if (occupied.has(hour + i) || !HOURS.includes(hour + i)) return false;
  }
  return true;
}

function occupySlots(occupied: Set<number>, hour: number, duration: number) {
  for (let i = 0; i < Math.ceil(duration); i++) {
    occupied.add(hour + i);
  }
}

export function generateSchedule(tasks: Task[]): Task[] {
  const week = getCurrentWeek();
  const patterns = getPatterns();

  const occupied: Record<string, Set<number>> = {};
  const result: Task[] = [];

  // First pass: place all fixed tasks at their exact times
  const fixedTasks = tasks.filter(t => t.isFixed && t.fixedHour !== undefined);
  const nonFixedTasks = tasks.filter(t => !t.isFixed || t.fixedHour === undefined);

  for (const task of fixedTasks) {
    if (!occupied[task.dueDay]) occupied[task.dueDay] = new Set();
    const hour = task.fixedHour!;
    occupySlots(occupied[task.dueDay], hour, task.duration);
    result.push({ ...task, scheduledHour: hour });
  }

  // Sort non-fixed: high priority first, then by effort
  const sorted = [...nonFixedTasks].sort((a, b) => {
    const pw = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (pw !== 0) return pw;
    const ew = { intense: 3, moderate: 2, light: 1 };
    return ew[b.effort] - ew[a.effort];
  });

  if (week >= 2 && patterns.length > 0) {
    // Smart mode: use completed patterns grouped by priority
    const completedByPriority: Record<string, number[]> = {};
    patterns.filter(p => p.completed).forEach(p => {
      const key = p.priority;
      if (!completedByPriority[key]) completedByPriority[key] = [];
      if (!completedByPriority[key].includes(p.hour)) {
        completedByPriority[key].push(p.hour);
      }
    });

    for (const task of sorted) {
      if (!occupied[task.dueDay]) occupied[task.dueDay] = new Set();
      const dayOccupied = occupied[task.dueDay];

      const patternHours = completedByPriority[task.priority] || [];
      const preferred = task.preferredTime ? getPreferredHourRange(task.preferredTime) : HOURS;
      const candidates = patternHours.length > 0
        ? [...new Set([...patternHours, ...preferred])]
        : preferred;

      let hour = candidates.find(h => HOURS.includes(h) && canFitTask(dayOccupied, h, task.duration));
      if (hour === undefined) hour = HOURS.find(h => canFitTask(dayOccupied, h, task.duration));
      if (hour === undefined) hour = 8;

      occupySlots(dayOccupied, hour, task.duration);
      result.push({ ...task, scheduledHour: hour });
    }
  } else {
    // Week 1: simple scheduling
    for (const task of sorted) {
      if (!occupied[task.dueDay]) occupied[task.dueDay] = new Set();
      const dayOccupied = occupied[task.dueDay];
      const preferred = task.preferredTime ? getPreferredHourRange(task.preferredTime) : HOURS;

      let hour = preferred.find(h => canFitTask(dayOccupied, h, task.duration));
      if (hour === undefined) hour = HOURS.find(h => canFitTask(dayOccupied, h, task.duration));
      if (hour === undefined) hour = 8;

      occupySlots(dayOccupied, hour, task.duration);
      result.push({ ...task, scheduledHour: hour });
    }
  }

  return result;
}

export function isLoggedIn(): boolean {
  return localStorage.getItem('cognitask_logged_in') === 'true';
}

export function login() {
  localStorage.setItem('cognitask_logged_in', 'true');
}

export function logout() {
  localStorage.removeItem('cognitask_logged_in');
}

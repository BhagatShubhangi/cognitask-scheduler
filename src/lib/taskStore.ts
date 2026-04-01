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
  if (time === 'morning') return [8, 9, 10, 11];
  if (time === 'afternoon') return [12, 13, 14, 15, 16];
  if (time === 'evening') return [17, 18, 19, 20, 21];
  return HOURS;
}

function getPriorityWeight(p: Priority): number {
  return p === 'high' ? 3 : p === 'medium' ? 2 : 1;
}

export function generateSchedule(tasks: Task[]): Task[] {
  const week = getCurrentWeek();
  const patterns = getPatterns();

  // Sort: high priority first, then by effort (intense first)
  const sorted = [...tasks].sort((a, b) => {
    const pw = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (pw !== 0) return pw;
    const ew = { intense: 3, moderate: 2, light: 1 };
    return ew[b.effort] - ew[a.effort];
  });

  // Track occupied slots per day
  const occupied: Record<string, Set<number>> = {};

  if (week >= 2 && patterns.length > 0) {
    // Smart mode: use patterns to determine best hours
    const completedByPriority: Record<string, number[]> = {};
    patterns.filter(p => p.completed).forEach(p => {
      const key = p.priority;
      if (!completedByPriority[key]) completedByPriority[key] = [];
      completedByPriority[key].push(p.hour);
    });

    return sorted.map(task => {
      if (!occupied[task.dueDay]) occupied[task.dueDay] = new Set();
      const dayOccupied = occupied[task.dueDay];

      // Find best hour from patterns or fallback
      const patternHours = completedByPriority[task.priority] || [];
      const preferred = task.preferredTime ? getPreferredHourRange(task.preferredTime) : HOURS;
      const candidates = patternHours.length > 0
        ? [...new Set([...patternHours, ...preferred])]
        : preferred;

      let hour = candidates.find(h => HOURS.includes(h) && !dayOccupied.has(h));
      if (hour === undefined) hour = HOURS.find(h => !dayOccupied.has(h)) || 8;

      for (let i = 0; i < Math.ceil(task.duration); i++) {
        dayOccupied.add(hour + i);
      }

      return { ...task, scheduledHour: hour };
    });
  }

  // Week 1: simple scheduling
  return sorted.map(task => {
    if (!occupied[task.dueDay]) occupied[task.dueDay] = new Set();
    const dayOccupied = occupied[task.dueDay];
    const preferred = task.preferredTime ? getPreferredHourRange(task.preferredTime) : HOURS;

    let hour = preferred.find(h => !dayOccupied.has(h));
    if (hour === undefined) hour = HOURS.find(h => !dayOccupied.has(h)) || 8;

    for (let i = 0; i < Math.ceil(task.duration); i++) {
      dayOccupied.add(hour + i);
    }

    return { ...task, scheduledHour: hour };
  });
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

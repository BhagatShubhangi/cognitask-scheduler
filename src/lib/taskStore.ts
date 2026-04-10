import { Task, DayOfWeek, HOURS, Priority, Effort } from './types';

const TASKS_KEY = 'cognitask_tasks';
const WEEK_KEY = 'cognitask_week';
const PATTERNS_KEY = 'cognitask_patterns';

// Multi-user support
export type UserRole = 'employee' | 'manager';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

function getUserPrefix(): string {
  const user = getCurrentUser();
  return user ? `cognitask_${user.id}_` : 'cognitask_';
}

export function getCurrentUser(): UserInfo | null {
  const raw = localStorage.getItem('cognitask_current_user');
  return raw ? JSON.parse(raw) : null;
}

export function getAllEmployees(): UserInfo[] {
  const raw = localStorage.getItem('cognitask_all_employees');
  return raw ? JSON.parse(raw) : [];
}

function registerEmployee(user: UserInfo) {
  if (user.role !== 'employee') return;
  const employees = getAllEmployees();
  if (!employees.find(e => e.id === user.id)) {
    employees.push(user);
    localStorage.setItem('cognitask_all_employees', JSON.stringify(employees));
  }
}

export function getEmployeeTasks(employeeId: string): Task[] {
  const raw = localStorage.getItem(`cognitask_${employeeId}_tasks`);
  return raw ? JSON.parse(raw) : [];
}

export function getEmployeeWeek(employeeId: string): number {
  const raw = localStorage.getItem(`cognitask_${employeeId}_week`);
  return raw ? parseInt(raw) : 1;
}

export function getTasks(): Task[] {
  const key = getUserPrefix() + 'tasks';
  const raw = localStorage.getItem(key);
  // Fallback to old key for migration
  if (!raw) {
    const old = localStorage.getItem(TASKS_KEY);
    return old ? JSON.parse(old) : [];
  }
  return JSON.parse(raw);
}

export function saveTasks(tasks: Task[]) {
  const key = getUserPrefix() + 'tasks';
  localStorage.setItem(key, JSON.stringify(tasks));
}

export function getCurrentWeek(): number {
  const key = getUserPrefix() + 'week';
  const raw = localStorage.getItem(key);
  if (!raw) {
    const old = localStorage.getItem(WEEK_KEY);
    return old ? parseInt(old) : 1;
  }
  return parseInt(raw);
}

export function setCurrentWeek(week: number) {
  const key = getUserPrefix() + 'week';
  localStorage.setItem(key, String(week));
}

// Predicted/simulated schedule storage
export function getSimulatedSchedule(): Task[] | null {
  const key = getUserPrefix() + 'simulated';
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export function saveSimulatedSchedule(tasks: Task[]) {
  const key = getUserPrefix() + 'simulated';
  localStorage.setItem(key, JSON.stringify(tasks));
}

export function clearSimulatedSchedule() {
  const key = getUserPrefix() + 'simulated';
  localStorage.removeItem(key);
}

interface PatternEntry {
  priority: Priority;
  effort: Effort;
  hour: number;
  completed: boolean;
}

export function getPatterns(): PatternEntry[] {
  const key = getUserPrefix() + 'patterns';
  const raw = localStorage.getItem(key);
  if (!raw) {
    const old = localStorage.getItem(PATTERNS_KEY);
    return old ? JSON.parse(old) : [];
  }
  return JSON.parse(raw);
}

export function savePattern(entry: PatternEntry) {
  const key = getUserPrefix() + 'patterns';
  const patterns = getPatterns();
  patterns.push(entry);
  localStorage.setItem(key, JSON.stringify(patterns));
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

  const fixedTasks = tasks.filter(t => t.isFixed && t.fixedHour !== undefined);
  const nonFixedTasks = tasks.filter(t => !t.isFixed || t.fixedHour === undefined);

  for (const task of fixedTasks) {
    if (!occupied[task.dueDay]) occupied[task.dueDay] = new Set();
    const hour = task.fixedHour!;
    occupySlots(occupied[task.dueDay], hour, task.duration);
    result.push({ ...task, scheduledHour: hour });
  }

  const sorted = [...nonFixedTasks].sort((a, b) => {
    const pw = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (pw !== 0) return pw;
    const ew = { intense: 3, moderate: 2, light: 1 };
    return ew[b.effort] - ew[a.effort];
  });

  if (week >= 2 && patterns.length > 0) {
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
  return localStorage.getItem('cognitask_current_user') !== null;
}

export function login(user: UserInfo) {
  localStorage.setItem('cognitask_current_user', JSON.stringify(user));
  registerEmployee(user);
}

export function logout() {
  localStorage.removeItem('cognitask_current_user');
}

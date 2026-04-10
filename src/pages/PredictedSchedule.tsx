import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, saveTasks, getPatterns, getCurrentWeek, setCurrentWeek, saveSimulatedSchedule } from '@/lib/taskStore';
import { Task, DAYS, HOURS, DayOfWeek, Priority, Effort } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

function formatHour(h: number): string {
  if (h === 12) return '12PM';
  return h > 12 ? `${h - 12}PM` : `${h}AM`;
}

function getTaskColor(priority: Priority, effort: Effort): string {
  if (priority === 'high' && effort === 'intense') return 'priority-high-intense';
  if (priority === 'high' && effort === 'moderate') return 'priority-orange';
  if (priority === 'medium') return 'priority-medium';
  if (priority === 'low') return 'priority-low';
  return 'priority-fixed';
}

function predictSchedule(tasks: Task[]): Task[] {
  const patterns = getPatterns();
  const occupied: Record<string, Set<number>> = {};
  const result: Task[] = [];

  const occupySlots = (day: string, hour: number, duration: number) => {
    if (!occupied[day]) occupied[day] = new Set();
    for (let i = 0; i < Math.ceil(duration); i++) occupied[day].add(hour + i);
  };

  const canFit = (day: string, hour: number, duration: number): boolean => {
    if (!occupied[day]) occupied[day] = new Set();
    for (let i = 0; i < Math.ceil(duration); i++) {
      if (occupied[day].has(hour + i) || !HOURS.includes(hour + i)) return false;
    }
    return true;
  };

  const fixed = tasks.filter(t => t.isFixed && t.fixedHour !== undefined);
  const nonFixed = tasks.filter(t => !t.isFixed || t.fixedHour === undefined);

  for (const task of fixed) {
    occupySlots(task.dueDay, task.fixedHour!, task.duration);
    result.push({ ...task, scheduledHour: task.fixedHour, status: 'not-started' });
  }

  const completedByPriority: Record<string, number[]> = {};
  patterns.filter(p => p.completed).forEach(p => {
    if (!completedByPriority[p.priority]) completedByPriority[p.priority] = [];
    if (!completedByPriority[p.priority].includes(p.hour)) {
      completedByPriority[p.priority].push(p.hour);
    }
  });

  const adjustedKey = 'cognitask_user_adjustments';
  const adjustments: Array<{ priority: string; hour: number }> = JSON.parse(localStorage.getItem(adjustedKey) || '[]');
  adjustments.forEach(a => {
    if (!completedByPriority[a.priority]) completedByPriority[a.priority] = [];
    if (!completedByPriority[a.priority].includes(a.hour)) {
      completedByPriority[a.priority].push(a.hour);
    }
  });

  const sorted = [...nonFixed].sort((a, b) => {
    const pw: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (pw[b.priority] || 0) - (pw[a.priority] || 0);
  });

  for (const task of sorted) {
    const patternHours = completedByPriority[task.priority] || [];
    let placed = false;
    for (const h of patternHours) {
      if (canFit(task.dueDay, h, task.duration)) {
        occupySlots(task.dueDay, h, task.duration);
        result.push({ ...task, scheduledHour: h, status: 'not-started' });
        placed = true;
        break;
      }
    }
    if (!placed) {
      const hour = HOURS.find(h => canFit(task.dueDay, h, task.duration)) ?? 8;
      occupySlots(task.dueDay, hour, task.duration);
      result.push({ ...task, scheduledHour: hour, status: 'not-started' });
    }
  }

  return result;
}

export default function PredictedSchedule() {
  const navigate = useNavigate();
  const [predicted, setPredicted] = useState<Task[]>([]);
  const week = getCurrentWeek();

  useEffect(() => {
    // Only allow predicting week 2 from week 1
    if (week !== 1) {
      navigate('/dashboard');
      return;
    }
    const tasks = getTasks();
    setPredicted(predictSchedule(tasks));
  }, []);

  const handleAccept = () => {
    // Save simulation and advance to week 2
    saveSimulatedSchedule(predicted);
    saveTasks(predicted);
    setCurrentWeek(2);
    navigate('/dashboard');
  };

  const getTasksStartingAt = (day: string, hour: number) =>
    predicted.filter(t => t.dueDay === day && t.scheduledHour === hour);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Predicted Week 2 Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-optimized based on your Week 1 productivity patterns</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        <div className="glass-card p-4 mb-6 border-fixed/30 bg-fixed/5 animate-slide-up flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-fixed flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Smart Prediction Active</p>
            <p className="text-xs text-muted-foreground">
              Tasks are placed at your most productive times based on Week 1 data. Fixed tasks (🔒) remain locked.
            </p>
          </div>
        </div>

        <div className="glass-card overflow-x-auto animate-slide-up mb-6">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border/50">
              <div className="p-2 text-xs text-muted-foreground" />
              {DAYS.map(d => (
                <div key={d} className="p-2 text-center text-sm font-semibold text-foreground border-l border-border/30">{d}</div>
              ))}
            </div>
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border/20 h-[48px]">
                <div className="p-2 text-xs text-muted-foreground flex items-start justify-end pr-3">{formatHour(hour)}</div>
                {DAYS.map(day => {
                  const slotTasks = getTasksStartingAt(day, hour);
                  return (
                    <div key={day} className="border-l border-border/20 p-0.5 relative">
                      {slotTasks.map(task => (
                        <div
                          key={task.id}
                          className={`absolute left-0.5 right-0.5 top-0.5 z-10 p-1.5 rounded-md text-xs font-medium ${getTaskColor(task.priority, task.effort)} ${task.isFixed ? 'border-2 border-dashed border-white/40' : ''}`}
                          style={{ height: `${Math.max(task.duration, 1) * 48 - 4}px` }}
                        >
                          <div className="flex items-center gap-1">
                            {task.isFixed && <Lock className="h-3 w-3 flex-shrink-0 opacity-80" />}
                            <span className="block truncate text-foreground font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{task.name}</span>
                          </div>
                          <span className="block text-[10px] opacity-80 ml-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {task.duration}h · {task.priority} {task.isFixed ? '· 🔒' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {(['high', 'medium', 'low'] as Priority[]).map(p => {
            const count = predicted.filter(t => t.priority === p).length;
            const label = p === 'high' ? '🔴 High' : p === 'medium' ? '🔵 Medium' : '🟢 Low';
            return (
              <div key={p} className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground">{label} Priority Tasks</div>
              </div>
            );
          })}
        </div>

        <Button onClick={handleAccept} size="lg" className="w-full font-semibold glow-primary">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Accept & Start Week 2
        </Button>
      </div>
    </div>
  );
}

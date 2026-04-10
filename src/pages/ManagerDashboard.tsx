import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, getEmployeeTasks, getEmployeeWeek, getCurrentUser } from '@/lib/taskStore';
import { Task, DAYS, HOURS, Priority, Effort, DayOfWeek } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Shield, Users, Clock, TrendingUp, Lock, ChevronDown, ChevronUp } from 'lucide-react';
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

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  tasks: Task[];
  week: number;
  optimizedHours: { hour: number; count: number }[];
  completionRate: number;
}

function getOptimizedHours(tasks: Task[]): { hour: number; count: number }[] {
  const hourMap: Record<number, number> = {};
  tasks.filter(t => t.status === 'done' && t.scheduledHour !== undefined).forEach(t => {
    hourMap[t.scheduledHour!] = (hourMap[t.scheduledHour!] || 0) + 1;
  });
  return Object.entries(hourMap)
    .map(([h, c]) => ({ hour: parseInt(h), count: c }))
    .sort((a, b) => b.count - a.count);
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/');
      return;
    }
    const allEmps = getAllEmployees();
    const empData: EmployeeData[] = allEmps.map(emp => {
      const tasks = getEmployeeTasks(emp.id);
      const done = tasks.filter(t => t.status === 'done').length;
      return {
        ...emp,
        tasks,
        week: getEmployeeWeek(emp.id),
        optimizedHours: getOptimizedHours(tasks),
        completionRate: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
      };
    });
    setEmployees(empData);
  }, []);

  const totalTasks = employees.reduce((s, e) => s + e.tasks.length, 0);
  const avgCompletion = employees.length > 0
    ? Math.round(employees.reduce((s, e) => s + e.completionRate, 0) / employees.length)
    : 0;

  const getTasksStartingAt = (tasks: Task[], day: string, hour: number) =>
    tasks.filter(t => t.dueDay === day && t.scheduledHour === hour);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-fixed" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
              <p className="text-muted-foreground text-sm">Overview of all employees' schedules and productivity</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center animate-slide-up">
            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{employees.length}</div>
            <div className="text-xs text-muted-foreground">Total Employees</div>
          </div>
          <div className="glass-card p-4 text-center animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <Clock className="h-5 w-5 text-medium mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div className="glass-card p-4 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <TrendingUp className="h-5 w-5 text-low mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{avgCompletion}%</div>
            <div className="text-xs text-muted-foreground">Avg Completion</div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="glass-card p-8 text-center animate-slide-up">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Employees Yet</h3>
            <p className="text-sm text-muted-foreground">Employees will appear here once they sign in and add tasks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {employees.map((emp, i) => (
              <div key={emp.id} className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Employee header */}
                <button
                  onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.email} · Week {emp.week}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{emp.tasks.length} tasks</div>
                      <div className="text-xs text-muted-foreground">{emp.completionRate}% done</div>
                    </div>
                    {/* Optimized hours badge */}
                    {emp.optimizedHours.length > 0 && (
                      <div className="hidden sm:block text-xs px-2 py-1 rounded-full bg-low/20 text-low border border-low/30">
                        Peak: {formatHour(emp.optimizedHours[0].hour)}
                      </div>
                    )}
                    {expandedEmployee === emp.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded: full schedule */}
                {expandedEmployee === emp.id && (
                  <div className="border-t border-border/30 p-4">
                    {/* Optimized times */}
                    {emp.optimizedHours.length > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-low/5 border border-low/20">
                        <p className="text-xs font-semibold text-foreground mb-1">🧠 Most Productive Hours</p>
                        <div className="flex flex-wrap gap-2">
                          {emp.optimizedHours.slice(0, 5).map(oh => (
                            <span key={oh.hour} className="text-xs px-2 py-1 rounded-full bg-low/20 text-low">
                              {formatHour(oh.hour)} ({oh.count} tasks done)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mini schedule grid */}
                    <div className="overflow-x-auto">
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
                          <div className="p-1 text-[10px] text-muted-foreground" />
                          {DAYS.map(d => (
                            <div key={d} className="p-1 text-center text-[10px] font-semibold text-foreground border-l border-border/30">{d}</div>
                          ))}
                        </div>
                        {HOURS.map(hour => {
                          const hasAnyTask = DAYS.some(day => getTasksStartingAt(emp.tasks, day, hour).length > 0);
                          if (!hasAnyTask) return null;
                          return (
                            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/20 h-[36px]">
                              <div className="p-1 text-[10px] text-muted-foreground flex items-center justify-end pr-2">{formatHour(hour)}</div>
                              {DAYS.map(day => {
                                const slotTasks = getTasksStartingAt(emp.tasks, day, hour);
                                return (
                                  <div key={day} className="border-l border-border/20 p-0.5 relative">
                                    {slotTasks.map(task => (
                                      <div
                                        key={task.id}
                                        className={`p-1 rounded text-[10px] font-medium truncate ${getTaskColor(task.priority, task.effort)} ${task.isFixed ? 'border border-dashed border-white/40' : ''}`}
                                      >
                                        {task.isFixed && '🔒 '}{task.name}
                                        {task.status === 'done' && ' ✓'}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

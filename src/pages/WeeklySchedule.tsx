import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, saveTasks } from '@/lib/taskStore';
import { Task, DAYS, HOURS, Priority, Effort, DayOfWeek } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutDashboard, X, Lock, GripVertical, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';

function getTaskColor(priority: Priority, effort: Effort): string {
  if (priority === 'high' && effort === 'intense') return 'priority-high-intense';
  if (priority === 'high' && effort === 'moderate') return 'priority-orange';
  if (priority === 'medium') return 'priority-medium';
  if (priority === 'low') return 'priority-low';
  return 'priority-fixed';
}

function formatHour(h: number): string {
  if (h === 12) return '12PM';
  return h > 12 ? `${h - 12}PM` : `${h}AM`;
}

function taskOccupiesSlot(task: Task, day: string, hour: number): boolean {
  if (task.dueDay !== day || task.scheduledHour === undefined) return false;
  const start = task.scheduledHour;
  const end = start + Math.ceil(task.duration);
  return hour >= start && hour < end;
}

function canPlaceTask(tasks: Task[], day: string, hour: number, duration: number, excludeId: string): boolean {
  for (let i = 0; i < Math.ceil(duration); i++) {
    const slotHour = hour + i;
    if (!HOURS.includes(slotHour)) return false;
    const conflict = tasks.find(t => t.id !== excludeId && taskOccupiesSlot(t, day, slotHour));
    if (conflict) return false;
  }
  return true;
}

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const [tasks, setTasksState] = useState<Task[]>(getTasks());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editHour, setEditHour] = useState<string>('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: string; hour: number } | null>(null);

  const openModal = (task: Task) => {
    setSelectedTask(task);
    setEditName(task.name);
    setEditPriority(task.priority);
    setEditHour(String(task.scheduledHour ?? task.fixedHour ?? 9));
  };

  const saveUserAdjustment = (priority: Priority, hour: number) => {
    const key = 'cognitask_user_adjustments';
    const adjustments: Array<{ priority: string; hour: number }> = JSON.parse(localStorage.getItem(key) || '[]');
    adjustments.push({ priority, hour });
    localStorage.setItem(key, JSON.stringify(adjustments));
  };

  const handleSaveEdit = () => {
    if (!selectedTask) return;
    const newHour = parseInt(editHour);
    const hourChanged = newHour !== selectedTask.scheduledHour && !selectedTask.isFixed;

    const updated = tasks.map(t => {
      if (t.id !== selectedTask.id) return t;
      const updatedTask = { ...t, name: editName, priority: editPriority };
      if (!t.isFixed && !isNaN(newHour) && canPlaceTask(tasks, t.dueDay, newHour, t.duration, t.id)) {
        updatedTask.scheduledHour = newHour;
        updatedTask.userAdjustedHour = newHour;
      }
      return updatedTask;
    });

    if (hourChanged && !isNaN(newHour)) {
      saveUserAdjustment(editPriority, newHour);
    }

    setTasksState(updated);
    saveTasks(updated);
    setSelectedTask(null);
  };

  const handleDeleteFromModal = () => {
    if (!selectedTask) return;
    const updated = tasks.filter(t => t.id !== selectedTask.id);
    setTasksState(updated);
    saveTasks(updated);
    setSelectedTask(null);
  };

  const getTasksStartingAt = (day: string, hour: number) =>
    tasks.filter(t => t.dueDay === day && t.scheduledHour === hour);

  const isOccupiedByContinuation = (day: string, hour: number) =>
    tasks.some(t => {
      if (t.dueDay !== day || t.scheduledHour === undefined) return false;
      return t.scheduledHour < hour && hour < t.scheduledHour + Math.ceil(t.duration);
    });

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.isFixed) { e.preventDefault(); return; }
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  }, [tasks]);

  const handleDragOver = useCallback((e: React.DragEvent, day: string, hour: number) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) return;
    if (canPlaceTask(tasks, day, hour, task.duration, draggedTaskId)) {
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ day, hour });
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDropTarget(null);
    }
  }, [draggedTaskId, tasks]);

  const handleDrop = useCallback((e: React.DragEvent, day: string, hour: number) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.isFixed) return;
    if (!canPlaceTask(tasks, day, hour, task.duration, draggedTaskId)) return;

    saveUserAdjustment(task.priority, hour);

    const updated = tasks.map(t =>
      t.id === draggedTaskId
        ? { ...t, dueDay: day as DayOfWeek, scheduledHour: hour, userAdjustedHour: hour }
        : t
    );
    setTasksState(updated);
    saveTasks(updated);
    setDraggedTaskId(null);
    setDropTarget(null);
  }, [draggedTaskId, tasks]);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDropTarget(null);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Weekly Schedule</h1>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          💡 Drag non-fixed tasks to move them. Click any task to edit its time — the model learns your preferences automatically.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          {[
            ['priority-high-intense', '🔴 High + Intense'],
            ['priority-orange', '🟠 High + Moderate'],
            ['priority-medium', '🔵 Medium'],
            ['priority-low', '🟢 Low / Light'],
            ['priority-fixed', '🟣 Fixed'],
          ].map(([cls, label]) => (
            <span key={cls} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${cls}`} /> {label}
            </span>
          ))}
        </div>

        <div className="glass-card overflow-x-auto animate-slide-up">
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
                  const isDropHere = dropTarget?.day === day && dropTarget?.hour === hour;

                  return (
                    <div
                      key={day}
                      className={`border-l border-border/20 p-0.5 relative ${isDropHere ? 'bg-primary/20' : ''}`}
                      onDragOver={e => handleDragOver(e, day, hour)}
                      onDrop={e => handleDrop(e, day, hour)}
                    >
                      {slotTasks.map(task => (
                        <div
                          key={task.id}
                          draggable={!task.isFixed}
                          onDragStart={e => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openModal(task)}
                          className={`absolute left-0.5 right-0.5 top-0.5 z-10 p-1.5 rounded-md text-xs font-medium transition-all hover:brightness-110 cursor-pointer ${getTaskColor(task.priority, task.effort)} ${task.isFixed ? 'border-2 border-dashed border-white/40' : ''} ${!task.isFixed ? 'hover:scale-[1.02] cursor-grab active:cursor-grabbing' : ''} ${draggedTaskId === task.id ? 'opacity-40' : ''}`}
                          style={{ height: `${Math.max(task.duration, 1) * 48 - 4}px` }}
                        >
                          <div className="flex items-center gap-1">
                            {task.isFixed ? (
                              <Lock className="h-3 w-3 flex-shrink-0 opacity-80" />
                            ) : (
                              <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
                            )}
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
      </div>

      {/* Modal with time change */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="glass-card p-6 w-full max-w-sm animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Edit Task</h3>
              <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-secondary/50 border-border/50" />
              <Select value={editPriority} onValueChange={v => setEditPriority(v as Priority)}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🔵 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Time change — only for non-fixed tasks */}
              {!selectedTask.isFixed && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                    <Clock className="h-3 w-3" /> Change Scheduled Time
                  </Label>
                  <Select value={editHour} onValueChange={setEditHour}>
                    <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HOURS.map(h => (
                        <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">The model will learn your time preferences automatically.</p>
                </div>
              )}

              {selectedTask.isFixed && (
                <p className="text-xs text-fixed flex items-center gap-1"><Lock className="h-3 w-3" /> Fixed task — time cannot be changed.</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">Save</Button>
                <Button onClick={handleDeleteFromModal} variant="destructive" className="flex-1">Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

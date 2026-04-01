import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, saveTasks } from '@/lib/taskStore';
import { Task, DAYS, HOURS, Priority, Effort } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutDashboard, X } from 'lucide-react';
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

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const [tasks, setTasksState] = useState<Task[]>(getTasks());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');

  const openModal = (task: Task) => {
    setSelectedTask(task);
    setEditName(task.name);
    setEditPriority(task.priority);
  };

  const handleSaveEdit = () => {
    if (!selectedTask) return;
    const updated = tasks.map(t => t.id === selectedTask.id ? { ...t, name: editName, priority: editPriority } : t);
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

  const getTasksForSlot = (day: string, hour: number) =>
    tasks.filter(t => t.dueDay === day && t.scheduledHour === hour);

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
            {/* Header */}
            <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border/50">
              <div className="p-2 text-xs text-muted-foreground" />
              {DAYS.map(d => (
                <div key={d} className="p-2 text-center text-sm font-semibold text-foreground border-l border-border/30">{d}</div>
              ))}
            </div>
            {/* Time slots */}
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border/20 min-h-[48px]">
                <div className="p-2 text-xs text-muted-foreground flex items-start justify-end pr-3">{formatHour(hour)}</div>
                {DAYS.map(day => {
                  const slotTasks = getTasksForSlot(day, hour);
                  return (
                    <div key={day} className="border-l border-border/20 p-0.5 relative">
                      {slotTasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => openModal(task)}
                          className={`w-full text-left p-1.5 rounded-md text-xs font-medium mb-0.5 transition-all hover:scale-[1.02] hover:brightness-110 ${getTaskColor(task.priority, task.effort)}`}
                          style={{ minHeight: `${Math.max(task.duration, 1) * 44}px` }}
                        >
                          <span className="block truncate text-foreground font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{task.name}</span>
                          <span className="block text-[10px] opacity-80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{task.duration}h · {task.priority}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
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

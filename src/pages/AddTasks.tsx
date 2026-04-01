import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, Priority, Effort, TimeOfDay, DayOfWeek, DAYS } from '@/lib/types';
import { getTasks, saveTasks, generateSchedule, getCurrentWeek } from '@/lib/taskStore';
import Navbar from '@/components/Navbar';

const priorityColors: Record<Priority, string> = {
  high: 'bg-high/20 text-high border-high/30',
  medium: 'bg-medium/20 text-medium border-medium/30',
  low: 'bg-low/20 text-low border-low/30',
};

export default function AddTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(getTasks());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [duration, setDuration] = useState('1');
  const [effort, setEffort] = useState<Effort>('moderate');
  const [preferredTime, setPreferredTime] = useState<TimeOfDay>('');
  const [dueDay, setDueDay] = useState<DayOfWeek>('Mon');

  const resetForm = () => {
    setName(''); setPriority('medium'); setDuration('1');
    setEffort('moderate'); setPreferredTime(''); setDueDay('Mon');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const task: Task = {
      id: editingId || crypto.randomUUID(),
      name: name.trim(),
      priority,
      duration: parseFloat(duration) || 1,
      effort,
      preferredTime,
      dueDay,
      status: 'not-started',
    };

    let updated: Task[];
    if (editingId) {
      updated = tasks.map(t => t.id === editingId ? task : t);
    } else {
      updated = [...tasks, task];
    }
    setTasks(updated);
    saveTasks(updated);
    resetForm();
  };

  const handleEdit = (task: Task) => {
    setName(task.name); setPriority(task.priority); setDuration(String(task.duration));
    setEffort(task.effort); setPreferredTime(task.preferredTime); setDueDay(task.dueDay);
    setEditingId(task.id);
  };

  const handleDelete = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleGenerate = () => {
    const scheduled = generateSchedule(tasks);
    saveTasks(scheduled);
    navigate('/schedule');
  };

  const week = getCurrentWeek();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Add Tasks</h1>
          {week >= 2 && (
            <span className="text-xs px-3 py-1 rounded-full bg-fixed/20 text-fixed border border-fixed/30">
              ✨ Smart Mode Active
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 mb-8 animate-slide-up">
          <Input
            placeholder="Task name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-secondary/50 border-border/50"
            required
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🔵 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0.5"
              max="8"
              step="0.5"
              placeholder="Hours"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
            <Select value={effort} onValueChange={v => setEffort(v as Effort)}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Effort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="intense">Intense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={preferredTime} onValueChange={v => setPreferredTime(v as TimeOfDay)}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Time (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">🌅 Morning</SelectItem>
                <SelectItem value="afternoon">☀️ Afternoon</SelectItem>
                <SelectItem value="evening">🌙 Evening</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dueDay} onValueChange={v => setDueDay(v as DayOfWeek)}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Day" /></SelectTrigger>
              <SelectContent>
                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            {editingId ? 'Update Task' : 'Add Task'}
          </Button>
        </form>

        {tasks.length > 0 && (
          <div className="space-y-3 mb-8">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className="glass-card-hover p-4 flex items-center justify-between"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">{task.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {task.duration}h · {task.effort} · {task.dueDay}
                    {task.preferredTime && ` · ${task.preferredTime}`}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => handleEdit(task)} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <Button onClick={handleGenerate} size="lg" className="w-full font-semibold glow-primary">
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Weekly Schedule
          </Button>
        )}
      </div>
    </div>
  );
}

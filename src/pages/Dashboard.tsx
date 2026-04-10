import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, saveTasks, getCurrentWeek, savePattern } from '@/lib/taskStore';
import { Task, DAYS, DayOfWeek, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Navbar from '@/components/Navbar';

const dayIndex = new Date().getDay();
const TODAY: DayOfWeek = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const energyData = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 8;
  const val = 50 + 40 * Math.sin(((hour - 6) * Math.PI) / 8) * (hour < 14 ? 1 : 0.7);
  return { hour: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`, energy: Math.round(val) };
});

const COLORS = ['hsl(0, 72%, 51%)', 'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)'];

const statusLabels: Record<TaskStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'done': 'Done',
};
const statusStyles: Record<TaskStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/20 text-primary',
  'done': 'bg-low/20 text-low',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasksState] = useState<Task[]>(getTasks());
  const week = getCurrentWeek();

  const todayTasks = tasks
    .filter(t => t.dueDay === TODAY)
    .sort((a, b) => {
      const pw: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return pw[a.priority] - pw[b.priority];
    });

  const toggleStatus = (id: string) => {
    const order: TaskStatus[] = ['not-started', 'in-progress', 'done'];
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      const idx = order.indexOf(t.status);
      const newStatus = order[(idx + 1) % 3];
      if (newStatus === 'done' && t.scheduledHour) {
        savePattern({ priority: t.priority, effort: t.effort, hour: t.scheduledHour, completed: true });
      }
      return { ...t, status: newStatus };
    });
    setTasksState(updated);
    saveTasks(updated);
  };

  const handleAdvanceWeek = () => {
    // Only allow simulating the very next week (week+1), not beyond
    navigate('/predicted');
  };

  const completionData = DAYS.map(day => ({
    day,
    completed: tasks.filter(t => t.dueDay === day && t.status === 'done').length,
    total: tasks.filter(t => t.dueDay === day).length,
  }));

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length },
  ].filter(d => d.value > 0);

  const doneTasks = todayTasks.filter(t => t.status === 'done').length;
  const pendingTasks = todayTasks.filter(t => t.status !== 'done').length;
  const loadLevel = pendingTasks === 0 ? 'Low' : pendingTasks <= 3 ? 'Medium' : 'High';
  const loadPercent = Math.min(100, (pendingTasks / Math.max(todayTasks.length, 1)) * 100);

  // Only allow simulate if we haven't already advanced beyond week 1
  const canSimulate = week === 1;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()} 👋</h1>
          <p className="text-muted-foreground mt-1">
            Week {week} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {week >= 2 && (
          <div className="glass-card p-4 mb-6 border-fixed/30 bg-fixed/5 animate-slide-up flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-fixed flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Smart Mode Active — Schedule based on your Week 1 behavior</p>
              <p className="text-xs text-muted-foreground">Tasks are auto-scheduled to your most productive time slots. Fixed tasks remain locked.</p>
            </div>
          </div>
        )}

        <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Today's Tasks — {TODAY}</h2>
          {todayTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all">
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{task.duration}h</span>
                    {task.isFixed && <span className="text-xs text-fixed ml-2">🔒</span>}
                  </div>
                  <button
                    onClick={() => toggleStatus(task.id)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${statusStyles[task.status]}`}
                  >
                    {statusLabels[task.status]}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Energy Curve</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 22%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 30%)', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="energy" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Cognitive Load Meter</h3>
            <div className="flex flex-col items-center justify-center h-[200px]">
              <div className="text-4xl font-bold text-foreground mb-2">{loadLevel}</div>
              <div className="w-full max-w-xs h-4 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${loadPercent}%`,
                    background: loadLevel === 'Low' ? 'hsl(142, 71%, 45%)' : loadLevel === 'Medium' ? 'hsl(217, 91%, 60%)' : 'hsl(0, 72%, 51%)',
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{doneTasks} done / {pendingTasks} pending</p>
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Completion Rate</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 22%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 30%)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="hsl(217, 33%, 30%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 30%)', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAdvanceWeek}
            size="lg"
            variant={canSimulate ? 'default' : 'outline'}
            className="flex-1 font-semibold"
            disabled={!canSimulate}
          >
            {canSimulate ? 'Simulate Next Week →' : `Week ${week} — Already Simulated`}
          </Button>
        </div>
      </div>
    </div>
  );
}

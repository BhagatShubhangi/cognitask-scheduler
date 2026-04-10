import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, UserRole } from '@/lib/taskStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    login({ id, name: name.trim() || email.split('@')[0], email, role });
    navigate(role === 'manager' ? '/manager' : '/tasks');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(217 91% 60%) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(270 67% 55%) 0%, transparent 70%)' }} />
      </div>

      <div className="glass-card p-8 w-full max-w-md animate-fade-in-scale relative">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 mb-4 animate-pulse-glow">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">CogniTask</h1>
          <p className="text-muted-foreground text-sm mt-1">Intelligent task scheduling</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRole('employee')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all border ${
              role === 'employee'
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-secondary/30 text-muted-foreground border-border/30 hover:bg-secondary/50'
            }`}
          >
            <User className="h-4 w-4" /> Employee
          </button>
          <button
            type="button"
            onClick={() => setRole('manager')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all border ${
              role === 'manager'
                ? 'bg-fixed/20 text-fixed border-fixed/40'
                : 'bg-secondary/30 text-muted-foreground border-border/30 hover:bg-secondary/50'
            }`}
          >
            <Shield className="h-4 w-4" /> Manager
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              required
            />
          </div>
          <Button type="submit" className="w-full font-semibold">
            {role === 'manager' ? 'Sign In as Manager' : 'Sign In as Employee'}
          </Button>
        </form>
      </div>
    </div>
  );
}

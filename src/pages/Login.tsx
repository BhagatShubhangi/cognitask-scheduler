import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/taskStore';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate('/tasks');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline font-medium"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

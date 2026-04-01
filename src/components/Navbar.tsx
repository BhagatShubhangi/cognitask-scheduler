import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, ListTodo, CalendarDays, LayoutDashboard, LogOut } from 'lucide-react';
import { logout } from '@/lib/taskStore';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/tasks', label: 'Add Tasks', icon: ListTodo },
    { to: '/schedule', label: 'Schedule', icon: CalendarDays },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/tasks" className="flex items-center gap-2 group">
          <Brain className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          <span className="text-lg font-bold text-foreground">CogniTask</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === to
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

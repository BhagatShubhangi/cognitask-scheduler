import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import AddTasks from "./pages/AddTasks";
import WeeklySchedule from "./pages/WeeklySchedule";
import Dashboard from "./pages/Dashboard";
import PredictedSchedule from "./pages/PredictedSchedule";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotFound from "./pages/NotFound";
import { isLoggedIn, getCurrentUser } from "./lib/taskStore";
import { useTaskReminders } from "./hooks/useTaskReminders";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/" replace />;
}

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'manager') return <Navigate to="/tasks" replace />;
  return <>{children}</>;
}

function AppWithReminders() {
  useTaskReminders();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/tasks" element={<ProtectedRoute><AddTasks /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><WeeklySchedule /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/predicted" element={<ProtectedRoute><PredictedSchedule /></ProtectedRoute>} />
        <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppWithReminders />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

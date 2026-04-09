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
import NotFound from "./pages/NotFound";
import { isLoggedIn } from "./lib/taskStore";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/tasks" element={<ProtectedRoute><AddTasks /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><WeeklySchedule /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/predicted" element={<ProtectedRoute><PredictedSchedule /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

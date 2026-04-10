import { useEffect, useRef } from 'react';
import { getTasks } from '@/lib/taskStore';
import { Task, DAYS, DayOfWeek } from '@/lib/types';
import { toast } from 'sonner';

const REMINDER_MINUTES_BEFORE = 15;

function getCurrentDayOfWeek(): DayOfWeek {
  const idx = new Date().getDay();
  return DAYS[idx === 0 ? 6 : idx - 1];
}

function formatHour(h: number): string {
  if (h === 12) return '12:00 PM';
  return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/placeholder.svg' });
  }
}

export function useTaskReminders() {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    requestNotificationPermission();

    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = getCurrentDayOfWeek();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      const tasks = getTasks();
      const todayTasks = tasks.filter(
        t => t.dueDay === currentDay && t.scheduledHour !== undefined && t.status !== 'done'
      );

      for (const task of todayTasks) {
        const taskMinutes = task.scheduledHour! * 60;
        const diff = taskMinutes - currentTotalMinutes;
        const reminderKey = `${task.id}_${task.scheduledHour}`;

        // Remind 15 mins before
        if (diff > 0 && diff <= REMINDER_MINUTES_BEFORE && !notifiedRef.current.has(reminderKey)) {
          notifiedRef.current.add(reminderKey);
          const msg = `"${task.name}" starts at ${formatHour(task.scheduledHour!)} — ${diff} min left`;
          toast.info('⏰ Upcoming Task', { description: msg, duration: 10000 });
          sendBrowserNotification('CogniTask Reminder', msg);
        }

        // Remind at exact time
        const startKey = `${task.id}_start`;
        if (diff <= 0 && diff > -2 && !notifiedRef.current.has(startKey)) {
          notifiedRef.current.add(startKey);
          const msg = `"${task.name}" is starting now!`;
          toast.warning('🚀 Task Starting', { description: msg, duration: 10000 });
          sendBrowserNotification('CogniTask — Task Starting', msg);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);
}

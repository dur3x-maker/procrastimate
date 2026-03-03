"use client";

import { useState, useEffect, useCallback } from "react";

const KEYS = {
  tasks: "pm_tasks",
  dayClosed: "pm_dayClosed",
  lastTaskDate: "pm_lastTaskDate",
  activeSession: "pm_activeSession",
} as const;

export type TaskType = "work" | "break";
export type TaskStatus = "pending" | "active" | "completed" | "abandoned";

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  durationMin: number;
  status: TaskStatus;
  completed: boolean; // deprecated, use status instead
  createdDayKey: string; // YYYY-MM-DD
  startedAt?: number;
  pausedAt?: number;
  totalPausedMs?: number;
  recommendation?: string;
}

const BREAK_LABELS = [
  "минут на мемы",
  "минут кофе",
  "минут просто посидеть",
  "минуты YouTube Shorts",
  "минут в соцсетях",
  "минут ничегонеделания",
  "минут созерцания",
  "минут на прокрутку ленты",
];

const BREAK_RECOMMENDATIONS = [
  "Самое время проверить, что нового в мире.",
  "Твой мозг заслужил паузу.",
  "Кофе не сварится сам.",
  "Отдых — это тоже работа.",
  "Перезагрузка в процессе...",
  "Ты это заслужил.",
  "Пора отвлечься.",
  "Продуктивность через отдых.",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBreakSlot(): Task {
  const duration = randomInt(12, 25);
  const label = randomItem(BREAK_LABELS);
  return {
    id: `break_${Date.now()}_${Math.random()}`,
    type: "break",
    title: `${duration} ${label}`,
    durationMin: duration,
    status: "pending",
    completed: false,
    createdDayKey: getDayKey(),
    recommendation: randomItem(BREAK_RECOMMENDATIONS),
  };
}

function resetIfNewDay() {
  const last = localStorage.getItem(KEYS.lastTaskDate);
  const today = todayStr();
  if (last !== today) {
    localStorage.setItem(KEYS.dayClosed, "false");
    localStorage.setItem(KEYS.lastTaskDate, today);
  }
}

export interface TasksState {
  tasks: Task[];
  todayTasks: Task[]; // filtered by current dayKey
  completedToday: Task[]; // completed tasks for today
  dayClosed: boolean;
  activeTask: Task | null;
  addTask: (title: string, durationMin: number) => void;
  startTask: (id: string) => void;
  completeTask: (id: string, elapsedMs?: number) => void;
  abandonTask: (id: string) => void; // replaces deleteTask
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  closeDay: () => { time: string; remaining: number };
  setOnTaskCompleted: (callback: (taskId: string) => void) => void;
}

export function useTasks(): TasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayClosed, setDayClosed] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [currentDayKey] = useState(getDayKey());
  const [onTaskCompletedCallback, setOnTaskCompletedCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    resetIfNewDay();
    const stored = localStorage.getItem(KEYS.tasks);
    let parsedTasks: Task[] = [];
    if (stored) {
      try {
        parsedTasks = JSON.parse(stored);
        setTasks(parsedTasks);
      } catch {
        setTasks([]);
      }
    }
    setDayClosed(localStorage.getItem(KEYS.dayClosed) === "true");

    const sessionRaw = localStorage.getItem(KEYS.activeSession);
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw) as { taskId: string; startedAt: number; durationMin: number; type: TaskType };
        const match = parsedTasks.find((t) => t.id === session.taskId && !t.completed);
        if (match) {
          setActiveTask({ ...match, startedAt: session.startedAt });
        } else {
          localStorage.removeItem(KEYS.activeSession);
        }
      } catch {
        localStorage.removeItem(KEYS.activeSession);
      }
    }
  }, []);

  const saveTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(KEYS.tasks, JSON.stringify(newTasks));
  }, []);

  const addTask = useCallback(
    (title: string, durationMin: number) => {
      if (dayClosed) {
        setDayClosed(false);
        localStorage.setItem(KEYS.dayClosed, "false");
      }
      const newTask: Task = {
        id: `task_${Date.now()}`,
        type: "work",
        title,
        durationMin,
        status: "pending",
        completed: false,
        createdDayKey: getDayKey(),
      };
      const breakSlot = generateBreakSlot();
      saveTasks([...tasks, newTask, breakSlot]);
    },
    [tasks, dayClosed, saveTasks]
  );

  const startTask = useCallback(
    (id: string) => {
      if (activeTask !== null) return;
      const task = tasks.find((t) => t.id === id);
      if (task) {
        const startedAt = Date.now();
        const updatedTask = { ...task, startedAt, status: "active" as TaskStatus };
        setActiveTask(updatedTask);
        
        // Update task status in tasks array
        const updatedTasks = tasks.map((t) => 
          t.id === id ? { ...t, status: "active" as TaskStatus } : t
        );
        saveTasks(updatedTasks);
        
        localStorage.setItem(KEYS.activeSession, JSON.stringify({
          taskId: task.id,
          startedAt,
          durationMin: task.durationMin,
          type: task.type,
        }));
      }
    },
    [tasks, activeTask, saveTasks]
  );

  const completeTask = useCallback(
    (id: string, elapsedMs?: number) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const actualElapsed = elapsedMs ?? (task.startedAt ? Date.now() - task.startedAt : 0);
      const totalPausedMs = task.totalPausedMs || 0;
      const netElapsed = actualElapsed - totalPausedMs;

      const updated = tasks.map((t) =>
        t.id === id ? { ...t, completed: true, status: "completed" as TaskStatus } : t
      );
      saveTasks(updated);

      const plannedMs = task.durationMin * 60_000;
      const countProgress = netElapsed >= plannedMs * 0.5;

      if (task.type === "work" && countProgress && onTaskCompletedCallback) {
        onTaskCompletedCallback(id);
      }

      setActiveTask(null);
      localStorage.removeItem(KEYS.activeSession);
    },
    [tasks, saveTasks, onTaskCompletedCallback]
  );

  const abandonTask = useCallback(
    (id: string) => {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, status: "abandoned" as TaskStatus } : t
      );
      saveTasks(updated);
      
      if (activeTask?.id === id) {
        setActiveTask(null);
        localStorage.removeItem(KEYS.activeSession);
      }
    },
    [tasks, activeTask, saveTasks]
  );

  const pauseTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || !task.startedAt) return;

      const pausedAt = Date.now();
      const updatedTask = { ...task, pausedAt };
      setActiveTask(updatedTask);
      
      const updatedTasks = tasks.map((t) =>
        t.id === id ? { ...t, pausedAt } : t
      );
      saveTasks(updatedTasks);
    },
    [tasks, saveTasks]
  );

  const resumeTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || !task.pausedAt) return;

      const pauseDuration = Date.now() - task.pausedAt;
      const totalPausedMs = (task.totalPausedMs || 0) + pauseDuration;
      const updatedTask = { ...task, pausedAt: undefined, totalPausedMs };
      setActiveTask(updatedTask);
      
      const updatedTasks = tasks.map((t) =>
        t.id === id ? { ...t, pausedAt: undefined, totalPausedMs } : t
      );
      saveTasks(updatedTasks);
    },
    [tasks, saveTasks]
  );

  const closeDay = useCallback((): { time: string; remaining: number } => {
    setDayClosed(true);
    localStorage.setItem(KEYS.dayClosed, "true");

    const remaining = tasks.filter((t) => !t.completed && t.type === "work").length;

    return { time: "0m", remaining };
  }, [tasks]);

  // Filter tasks by current day
  const todayTasks = tasks.filter(
    (t) => t.createdDayKey === currentDayKey && (t.status === "pending" || t.status === "active")
  );
  
  const completedToday = tasks.filter(
    (t) => t.createdDayKey === currentDayKey && t.status === "completed"
  );

  const setOnTaskCompleted = useCallback((callback: (taskId: string) => void) => {
    setOnTaskCompletedCallback(() => callback);
  }, []);

  return {
    tasks,
    todayTasks,
    completedToday,
    dayClosed,
    activeTask,
    addTask,
    startTask,
    completeTask,
    abandonTask,
    pauseTask,
    resumeTask,
    closeDay,
    setOnTaskCompleted,
  };
}

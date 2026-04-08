"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── localStorage keys ──
const KEYS = {
  todayTotalTime: "pm_todayTotalTime",
  sessionCount: "pm_sessionCount",
  breaksTaken: "pm_breaksTaken",
  lastActiveDate: "pm_lastActiveDate",
  lastSessionStart: "pm_lastSessionStart",
  firstSessionHour: "pm_firstSessionHour",
  funengineOpensToday: "pm_funengineOpensToday",
  resistedDistractionsToday: "pm_resistedDistractionsToday",
  skippedBreaksToday: "pm_skippedBreaksToday",
  idleWithinSessionMs: "pm_idleWithinSessionMs",
  lastTaskEndTime: "pm_lastTaskEndTime",
} as const;

// ── helpers ──
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readNum(key: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(key) || "0");
}

function writeNum(key: string, val: number) {
  localStorage.setItem(key, String(val));
}

// ── daily reset ──
function resetIfNewDay() {
  const last = localStorage.getItem(KEYS.lastActiveDate);
  const today = todayStr();
  if (last !== today) {
    writeNum(KEYS.todayTotalTime, 0);
    writeNum(KEYS.sessionCount, 0);
    writeNum(KEYS.breaksTaken, 0);
    writeNum(KEYS.funengineOpensToday, 0);
    writeNum(KEYS.resistedDistractionsToday, 0);
    writeNum(KEYS.skippedBreaksToday, 0);
    writeNum(KEYS.idleWithinSessionMs, 0);
    localStorage.removeItem(KEYS.lastSessionStart);
    localStorage.removeItem(KEYS.firstSessionHour);
    localStorage.removeItem(KEYS.lastTaskEndTime);
    localStorage.setItem(KEYS.lastActiveDate, today);
  }
}

// ── constants ──
const MIN_SESSION_MS = 60_000;

// ── energy formula ──
function calcEnergy(totalMs: number, sessions: number, breaks: number): number {
  const hours = totalMs / 3_600_000;
  const hourNow = new Date().getHours();
  let score = hours * 10 + sessions * 5 - breaks * 10;
  if (hourNow >= 22) score += 15;
  return Math.round(Math.min(100, Math.max(0, score)));
}


// ── main hook ──
export interface DashboardState {
  todayTotalTime: number;   // ms
  sessionCount: number;
  breaksTaken: number;
  sessionActive: boolean;
  elapsedMs: number;        // live timer while session is active
  energyScore: number;
  idleWithinSessionMs: number;
  startSession: () => void;
  endSession: () => void;
  takeBreak: () => void;
  setActiveTaskId: (taskId: string | null) => void;
  setOnSessionEnded: (callback: (metadata: { no_breaks: boolean; hour: number }) => void) => void;
}

export function useDashboardStore(): DashboardState {
  const [todayTotalTime, setTodayTotalTime] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [firstSessionHour, setFirstSessionHour] = useState<number | null>(null);
  const [idleWithinSessionMs, setIdleWithinSessionMs] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [onSessionEndedCallback, setOnSessionEndedCallback] = useState<((metadata: { no_breaks: boolean; hour: number }) => void) | null>(null);

  // hydrate from localStorage on mount
  useEffect(() => {
    resetIfNewDay();
    setTodayTotalTime(readNum(KEYS.todayTotalTime));
    setSessionCount(readNum(KEYS.sessionCount));
    setBreaksTaken(readNum(KEYS.breaksTaken));
    setIdleWithinSessionMs(readNum(KEYS.idleWithinSessionMs));

    const savedStart = localStorage.getItem(KEYS.lastSessionStart);
    if (savedStart) {
      const ts = Number(savedStart);
      if (!isNaN(ts) && ts > 0) {
        setSessionStart(ts);
      }
    }

    const savedHour = localStorage.getItem(KEYS.firstSessionHour);
    if (savedHour !== null) {
      setFirstSessionHour(Number(savedHour));
    }
  }, []);

  // live timer tick
  useEffect(() => {
    if (sessionStart) {
      setElapsedMs(Date.now() - sessionStart);
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - sessionStart);
      }, 1000);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStart]);

  // idle timer - track time without active task
  useEffect(() => {
    if (sessionStart && !activeTaskId) {
      idleTimerRef.current = setInterval(() => {
        setIdleWithinSessionMs(prev => {
          const newIdle = prev + 1000;
          writeNum(KEYS.idleWithinSessionMs, newIdle);
          return newIdle;
        });
      }, 1000);
    } else {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [sessionStart, activeTaskId]);

  const startSession = useCallback(() => {
    if (sessionStart !== null) return;
    const now = Date.now();
    setSessionStart(now);
    localStorage.setItem(KEYS.lastSessionStart, String(now));

    // track first session hour of the day for achievement
    if (firstSessionHour === null) {
      const hour = new Date().getHours();
      setFirstSessionHour(hour);
      localStorage.setItem(KEYS.firstSessionHour, String(hour));
    }
  }, [sessionStart, firstSessionHour]);

  const endSession = useCallback(() => {
    if (!sessionStart) return;
    const duration = Date.now() - sessionStart;

    setSessionStart(null);
    setElapsedMs(0);
    setActiveTaskId(null);
    localStorage.removeItem(KEYS.lastSessionStart);

    if (duration < MIN_SESSION_MS) {
      return;
    }

    const newTotal = todayTotalTime + duration;
    const newCount = sessionCount + 1;

    setTodayTotalTime(newTotal);
    setSessionCount(newCount);

    writeNum(KEYS.todayTotalTime, newTotal);
    writeNum(KEYS.sessionCount, newCount);

    if (onSessionEndedCallback) {
      const hour = new Date().getHours();
      const no_breaks = breaksTaken === 0;
      onSessionEndedCallback({ no_breaks, hour });
    }

    // Backend sync removed - stats are now fetched from backend only
  }, [sessionStart, todayTotalTime, sessionCount, breaksTaken, onSessionEndedCallback]);

  const takeBreak = useCallback(() => {
    const newBreaks = breaksTaken + 1;
    setBreaksTaken(newBreaks);
    writeNum(KEYS.breaksTaken, newBreaks);
  }, [breaksTaken]);

  const effectiveTotal = todayTotalTime + elapsedMs - idleWithinSessionMs;
  const energyScore = calcEnergy(effectiveTotal, sessionCount, breaksTaken);

  const setOnSessionEnded = useCallback((callback: (metadata: { no_breaks: boolean; hour: number }) => void) => {
    setOnSessionEndedCallback(() => callback);
  }, []);

  return {
    todayTotalTime: effectiveTotal,
    sessionCount,
    breaksTaken,
    sessionActive: sessionStart !== null,
    elapsedMs,
    energyScore,
    idleWithinSessionMs,
    startSession,
    endSession,
    takeBreak,
    setActiveTaskId,
    setOnSessionEnded,
  };
}

"use client";

import { useState, useEffect } from "react";
import { useStats } from "@/hooks/useStats";

interface SelfReportPanelProps {
  mode: "self" | "employer";
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

function readLocalStorageNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const val = Number(localStorage.getItem(key) || "0");
  return isNaN(val) ? 0 : val;
}

export function SelfReportPanel({ mode }: SelfReportPanelProps) {
  const { data, loading, error } = useStats("weekly");
  const [funengineOpens, setFunengineOpens] = useState(0);
  const [resistedDistractions, setResistedDistractions] = useState(0);
  const [skippedBreaks, setSkippedBreaks] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFunengineOpens(readLocalStorageNumber("pm_funengineOpensToday"));
    setResistedDistractions(readLocalStorageNumber("pm_resistedDistractionsToday"));
    setSkippedBreaks(readLocalStorageNumber("pm_skippedBreaksToday"));
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-base font-bold mb-3">Self Report</h2>
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-base font-bold mb-3">Self Report</h2>
        <p className="text-sm text-muted">Failed to load data</p>
      </div>
    );
  }

  const totalFocusMinutes = data.total_focus_minutes || 0;
  const totalBreakMinutes = data.total_break_minutes || 0;
  const completedSessions = data.total_sessions || 0;
  const completedTasks = data.total_completed_tasks || 0;
  const streak = data.streak || 0;

  if (mode === "employer") {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-base font-bold mb-3">Report</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Total focus time</span>
            <span className="font-medium">{formatTime(totalFocusMinutes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Sessions completed</span>
            <span className="font-medium">{completedSessions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Tasks completed</span>
            <span className="font-medium">{completedTasks}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="text-base font-bold mb-3">Self Report</h2>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total focus time</span>
          <span className="font-medium">{formatTime(totalFocusMinutes)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total break time</span>
          <span className="font-medium">{formatTime(totalBreakMinutes)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Sessions completed</span>
          <span className="font-medium">{completedSessions}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Tasks completed</span>
          <span className="font-medium">{completedTasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Current streak</span>
          <span className="font-medium">{streak}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">FunEngine opens today</span>
          <span className="font-medium">{funengineOpens}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Resisted distractions today</span>
          <span className="font-medium">{resistedDistractions}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Skipped breaks today</span>
          <span className="font-medium">{skippedBreaks}</span>
        </div>
      </div>

      {(resistedDistractions > 0 || funengineOpens > 0) && (
        <div className="pt-3 border-t border-border space-y-1">
          {resistedDistractions > 0 && (
            <p className="text-xs text-muted">
              You resisted distraction {resistedDistractions} {resistedDistractions === 1 ? "time" : "times"} today.
            </p>
          )}
          {funengineOpens > 0 && (
            <p className="text-xs text-muted">
              You allowed yourself to reset {funengineOpens} {funengineOpens === 1 ? "time" : "times"}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

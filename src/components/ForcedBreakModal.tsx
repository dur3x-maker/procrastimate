"use client";

import { useState, useEffect, useRef } from "react";
import type { ToneMode } from "@/utils/toneEngine";

interface ForcedBreakModalProps {
  open: boolean;
  mode: ToneMode | null;
  onClose: () => void;
  onSnooze: () => void;
  onStartBreak: () => void;
}

export function ForcedBreakModal({ open, mode, onClose, onSnooze, onStartBreak }: ForcedBreakModalProps) {
  const [breakTimer, setBreakTimer] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (breakTimer) {
      setRemainingSeconds(300);
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setBreakTimer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breakTimer]);

  const handleStartBreak = () => {
    setBreakTimer(Date.now());
    onStartBreak();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (!open) return null;

  const isAbsurd = mode === "absurd";
  const title = isAbsurd ? "CRITICAL: forced cooldown initiated." : "System intervention: cooldown recommended.";
  const emoji = isAbsurd ? "🔥" : "⚠️";

  if (breakTimer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
          <div className="text-5xl mb-4">☕</div>
          <h3 className="text-xl font-bold mb-2">Break in progress</h3>
          <p className="text-4xl font-mono font-bold mb-6">{formatTime(remainingSeconds)}</p>
          <p className="text-sm text-muted">Breathe. You're doing great.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
        <div className="text-5xl mb-4">{emoji}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted mb-6">
          {isAbsurd 
            ? "You've exceeded safe productivity limits. Mandatory cooldown recommended."
            : "You're running hot. Time to step back before burnout."}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleStartBreak}
            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Ладно, отдыхаю (5 min)
          </button>
          
          <button
            onClick={onSnooze}
            className="w-full py-3 rounded-full border-2 border-border text-foreground font-semibold hover:bg-border/50 transition-colors"
          >
            Ещё 15 минут, честно
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

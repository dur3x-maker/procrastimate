"use client";

import { useTranslations } from "next-intl";
import type { Task } from "@/hooks/useTasks";

interface ActiveSessionPanelProps {
  activeTask: Task | null;
  elapsedMs: number;
  onComplete: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

function formatTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


export function ActiveSessionPanel({
  activeTask,
  elapsedMs,
  onComplete,
  onPause,
  onResume,
}: ActiveSessionPanelProps) {
  const t = useTranslations("activeSession");
  if (!activeTask) return null;

  const isBreak = activeTask.type === "break";
  const targetMs = activeTask.durationMin * 60 * 1000;
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  const overtimeMs = elapsedMs > targetMs ? elapsedMs - targetMs : 0;

  return (
    <div className="bg-gradient-to-br from-purple-start/10 to-purple-end/10 border-2 border-purple-start/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🔥</span>
        <h3 className="text-sm font-bold uppercase tracking-wider">
          {isBreak ? t("breakTitle") : t("taskTitle")}
        </h3>
      </div>

      {!isBreak && (
        <p className="text-sm font-semibold mb-2 line-clamp-2">
          {activeTask.title}
        </p>
      )}

      {isBreak && activeTask.recommendation && (
        <p className="text-xs text-muted italic mb-2">
          {activeTask.recommendation}
        </p>
      )}

      <div className="font-mono text-3xl font-bold text-purple-start text-center my-3">
        {formatTimer(remainingMs)}
      </div>
      {!isBreak && overtimeMs > 0 && (
        <p className="text-xs text-muted text-center -mt-1 mb-2">
          {t("overtime", { time: formatTimer(overtimeMs) })}
        </p>
      )}

      <div className="flex gap-2">
        {!isBreak && activeTask.pausedAt && onResume ? (
          <button
            onClick={onResume}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            ▶ Resume
          </button>
        ) : !isBreak && onPause ? (
          <button
            onClick={onPause}
            className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            ⏸ Pause
          </button>
        ) : null}
        <button
          onClick={onComplete}
          className="flex-1 py-2 px-3 rounded-lg bg-purple-start text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          {t("complete")}
        </button>
      </div>
    </div>
  );
}

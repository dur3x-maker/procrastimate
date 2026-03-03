"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStats, type StatsRange } from "@/hooks/useStats";

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function StatsPanel() {
  const t = useTranslations("stats");
  const [currentRange, setCurrentRange] = useState<StatsRange>("weekly");
  const { data, loading, error, setRange } = useStats(currentRange);

  const handleRangeChange = (range: StatsRange) => {
    setCurrentRange(range);
    setRange(range);
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold">{t("title")}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => handleRangeChange("weekly")}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentRange === "weekly"
                ? "bg-purple-start text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            {t("weekly")}
          </button>
          <button
            onClick={() => handleRangeChange("monthly")}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentRange === "monthly"
                ? "bg-purple-start text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            {t("monthly")}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-muted text-center py-4">
          {t("loading")}
        </div>
      )}

      {error && (
        <div className="text-xs text-muted text-center py-4">
          {t("error")}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-background rounded-lg border border-border">
            <span className="text-xs text-muted">{t("totalFocus")}</span>
            <span className="text-sm font-bold text-purple-start">
              {formatTime(data.total_focus_minutes)}
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-background rounded-lg border border-border">
            <span className="text-xs text-muted">{t("totalBreak")}</span>
            <span className="text-sm font-bold">
              {formatTime(data.total_break_minutes)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-background rounded-lg border border-border text-center">
              <div className="text-lg font-bold text-purple-start">
                {data.total_sessions}
              </div>
              <div className="text-xs text-muted">{t("sessions")}</div>
            </div>

            <div className="p-2 bg-background rounded-lg border border-border text-center">
              <div className="text-lg font-bold text-purple-start">
                {data.total_completed_tasks}
              </div>
              <div className="text-xs text-muted">{t("tasks")}</div>
            </div>

            <div className="p-2 bg-background rounded-lg border border-border text-center">
              <div className="text-lg font-bold text-purple-start">
                {data.streak}
              </div>
              <div className="text-xs text-muted">{t("streak")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";

interface ProcrastinationStatsProps {
  breakTimeToday: number;
  completedTasksToday: number;
  tasks: { completed: boolean; type: string }[];
}

function getBadge(breakTime: number): { level: string; icon: string } {
  if (breakTime >= 90) {
    return { level: "master", icon: "👑" };
  } else if (breakTime >= 30) {
    return { level: "pro", icon: "🎯" };
  } else {
    return { level: "novice", icon: "🌱" };
  }
}

export function ProcrastinationStats({
  breakTimeToday,
  completedTasksToday,
  tasks,
}: ProcrastinationStatsProps) {
  const t = useTranslations("stats");
  
  const totalMinutesInDay = 16 * 60; // Assuming 16 waking hours
  const restPercentage = Math.min(
    100,
    Math.round((breakTimeToday / totalMinutesInDay) * 100)
  );
  
  const completedBreaks = tasks.filter(
    (t) => t.type === "break" && t.completed
  ).length;
  
  const avgTimeToBreak = completedBreaks > 0 
    ? Math.round(breakTimeToday / completedBreaks)
    : 0;
  
  const badge = getBadge(breakTimeToday);
  
  const hours = Math.floor(breakTimeToday / 60);
  const mins = breakTimeToday % 60;
  const timeStr = hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3">
      <h2 className="text-base font-bold mb-1.5">{t("title")}</h2>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-background rounded-xl p-2 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">
            {t("totalBreakTime")}
          </p>
          <p className="text-lg font-bold text-purple-start">{timeStr}</p>
        </div>
        
        <div className="bg-background rounded-xl p-2 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">
            {t("restPercentage")}
          </p>
          <p className="text-lg font-bold text-purple-start">{restPercentage}%</p>
        </div>
        
        <div className="bg-background rounded-xl p-2 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">
            {t("avgTimeToBreak")}
          </p>
          <p className="text-lg font-bold">{avgTimeToBreak}м</p>
        </div>
        
        <div className="bg-background rounded-xl p-2 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">
            {t("completedTasks")}
          </p>
          <p className="text-lg font-bold">{completedTasksToday}</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-start/10 to-purple-end/10 rounded-xl p-2 border border-purple-start/20 text-center">
        <div className="text-2xl mb-0.5">{badge.icon}</div>
        <p className="text-xs font-bold text-purple-start">
          {t(`badge.${badge.level}`)}
        </p>
      </div>
    </div>
  );
}

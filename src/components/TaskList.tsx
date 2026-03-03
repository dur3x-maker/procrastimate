"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Task } from "@/hooks/useTasks";

interface TaskListProps {
  tasks: Task[];
  completedToday: Task[];
  dayClosed: boolean;
  activeTask: Task | null;
  onAddTask: (title: string, durationMin: number) => void;
  onStartTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onAbandonTask: (id: string) => void;
}

export function TaskList({
  tasks,
  completedToday,
  dayClosed,
  activeTask,
  onAddTask,
  onStartTask,
  onCompleteTask,
  onAbandonTask,
}: TaskListProps) {
  const t = useTranslations("tasks");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddTask(title, duration);
    setTitle("");
    setDuration(45);
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3">
      <h2 className="text-base font-bold mb-1.5">{t("title")}</h2>

      {dayClosed && (
        <div className="mb-2 p-2 bg-purple-start/10 border border-purple-start/20 rounded-lg text-center">
          <p className="text-sm font-medium text-purple-start">{t("dayClosedTitle")}</p>
          <p className="text-xs text-purple-start/70 mt-0.5">{t("dayClosedSubtitle")}</p>
        </div>
      )}

      <div className="mb-2 space-y-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-start/50 transition"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <div className="flex gap-3">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="5"
            max="240"
            className="w-24 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-start/50 transition"
          />
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="flex-1 py-2 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("addButton")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {tasks.filter((t) => t.type === "work" && (t.status === "pending" || t.status === "active")).length === 0 ? (
          <p className="text-sm text-muted text-center py-8">{t("empty")}</p>
        ) : (
          tasks.filter((t) => t.type === "work" && (t.status === "pending" || t.status === "active")).map((task) => (
            <div
              key={task.id}
              className={`p-3 border-b last:border-b-0 transition-all ${
                task.status === "completed" ? "bg-background/50 opacity-60" : "bg-background"
              } ${activeTask?.id === task.id ? "ring-2 ring-inset ring-purple-start" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📋</span>
                    <span
                      className={`text-sm font-semibold ${
                        task.status === "completed" ? "line-through" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {task.durationMin} {t("minutes")}
                  </p>
                  {task.recommendation && activeTask?.id === task.id && (
                    <p className="text-xs text-purple-start mt-2 italic">
                      {task.recommendation}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {task.status !== "completed" && task.status !== "abandoned" && (
                    <>
                      {activeTask?.id === task.id ? (
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-purple-start text-white hover:opacity-90 transition-opacity"
                        >
                          {t("completeButton")}
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartTask(task.id)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-purple-start/10 text-purple-start hover:bg-purple-start/20 transition-colors"
                        >
                          {task.type === "break"
                            ? t("startBreak")
                            : t("startTask")}
                        </button>
                      )}
                      <button
                        onClick={() => onAbandonTask(task.id)}
                        className="px-2 py-1 text-xs font-medium rounded-md text-muted hover:text-foreground hover:bg-border/50 transition-colors"
                        title="Отказаться от задачи"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {completedToday.filter((t) => t.type === "work").length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-border/30 transition-colors"
          >
            <span className="text-sm font-medium text-muted">
              Выполненные сегодня ({completedToday.filter((t) => t.type === "work").length})
            </span>
            <span className="text-muted">{showCompleted ? "▲" : "▼"}</span>
          </button>
          {showCompleted && (
            <div className="mt-2 rounded-lg border border-border overflow-hidden">
              {completedToday.filter((t) => t.type === "work").map((task) => (
                <div
                  key={task.id}
                  className="p-3 border-b last:border-b-0 bg-background/50 opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">✅</span>
                        <span className="text-sm font-semibold line-through">
                          {task.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {task.durationMin} {t("minutes")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

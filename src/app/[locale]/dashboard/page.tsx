"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useEffect, useRef } from "react";
import { useDashboardStore } from "@/hooks/useDashboardStore";
import { useTasks } from "@/hooks/useTasks";
import { useToneEngine } from "@/hooks/useToneEngine";
import { useBackendAchievements } from "@/hooks/useBackendAchievements";
import { useBackendStats } from "@/hooks/useBackendStats";
import { api } from "@/lib/api";
import { TaskList } from "@/components/TaskList";
import { JustificationGenerator } from "@/components/JustificationGenerator";

import { StatsPanel } from "@/components/StatsPanel";
import { ActiveSessionPanel } from "@/components/ActiveSessionPanel";
import { BreakModal } from "@/components/BreakModal";
import { DestroyDayModal } from "@/components/DestroyDayModal";
import { ShareButton } from "@/components/ShareButton";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { FunEngineModal } from "@/components/FunEngineModal";
import { SelfReportPanel } from "@/components/SelfReportPanel";
import { BreakSuggestionBar } from "@/components/BreakSuggestionBar";
import type { SharePayload } from "@/utils/shareGenerator";
import { calculateEnergy, type EnergyLevel } from "@/lib/energy";
import { incrementFunEngineOpens, incrementResistedDistractions, incrementSkippedBreaks, getFunEngineOpensToday, getSkippedBreaksToday, incrementIgnoredBreaks, getIgnoredBreaksToday, getLastBreakSuggestionTime, setLastBreakSuggestionTime } from "@/lib/dailyCounters";
import { getRandomDayStartText } from "@/lib/dayStartGenerator";
import { getUserId } from "@/lib/userId";
import { sendEventWithRetry, flushEventQueue } from "@/lib/eventQueue";

function formatTime(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}


function EnergyScore({ score, label, totalTime, onClick }: { score: number; label: string; totalTime: number; onClick: () => void }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" 
      style={{ width: 180, height: 180 }}
      onClick={onClick}
    >
      <svg
        style={{ width: 180, height: 180 }}
        className="-rotate-90"
        viewBox="0 0 200 200"
      >
        <defs>
          <linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#eg)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-4xl font-bold leading-none">{score}</span>
        <span className="text-xs uppercase tracking-wide opacity-60">{label}</span>
      </div>
    </div>
  );
}

function CatModal({
  open,
  onClose,
  title,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/XyNlqQId-nk?autoplay=1"
              title="Therapeutic Kittens"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-border text-sm font-medium hover:bg-border/50 transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tTasks = useTranslations("tasks");
  const locale = useLocale();
  const router = useRouter();
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [daySummary, setDaySummary] = useState<string | null>(null);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [isEarlyCompletion, setIsEarlyCompletion] = useState(false);
  const [pendingBreakSlot, setPendingBreakSlot] = useState<string | null>(null);
  const [destroyDayModalOpen, setDestroyDayModalOpen] = useState(false);
  const [funModalOpen, setFunModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMode, setReportMode] = useState<"self" | "employer">("self");
  const [showEnergyScore, setShowEnergyScore] = useState(true);
  const [distractionUsed, setDistractionUsed] = useState(false);
  const [distractionDismissed, setDistractionDismissed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [dayStartCTA, setDayStartCTA] = useState("");
  const hasTrackedGhost = useRef(false);
  const [showBreakSuggestion, setShowBreakSuggestion] = useState(false);
  const [userId, setUserId] = useState("");
  const [clientSessionId, setClientSessionId] = useState<string | null>(null);

  const store = useDashboardStore();
  const taskStore = useTasks();
  const backendAchievements = useBackendAchievements();
  const backendStats = useBackendStats();
  const callbacksSetRef = useRef(false);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  useEffect(() => {
    if (callbacksSetRef.current) return;
    if (!userId) return;
    
    taskStore.setOnTaskCompleted(async (taskId: string) => {
      const idemKey = `tc_${taskId}_${Date.now()}`;
      console.log("[event] task_completed sent:", taskId, "idem:", idemKey);
      await sendEventWithRetry(userId, "task_completed", {
        task_id: taskId,
        idempotency_key: idemKey,
        client_session_id: clientSessionId,
      });
      await backendStats.refreshStats();
    });
    
    store.setOnSessionEnded(async (metadata) => {
      console.log("[event] session_ended sent:", metadata);
      await sendEventWithRetry(userId, "session_ended", {
        ...metadata,
        client_session_id: clientSessionId,
      });
      await backendStats.refreshStats();
      setClientSessionId(null);
    });
    
    callbacksSetRef.current = true;
  }, [userId]);

  // Tone engine integration
  const focusMinutesToday = Math.floor(store.todayTotalTime / 60_000);
  const sessionCount = backendStats.dailySession?.session_count || 0;
  const completedTasks = backendStats.dailySession?.completed_tasks || 0;
  const breakMinutes = backendStats.dailySession?.break_minutes || 0;
  const breakIgnored = Math.max(0, sessionCount - store.breaksTaken - 1);
  const { toneMessage, isLoading: toneLoading, mode, rarity } = useToneEngine(locale, {
    focusMinutesToday,
    focusSessions: sessionCount,
    breakIgnored,
    completedTasks,
  });

  // Energy-based overheating detection
  const [currentEnergyLevel, setCurrentEnergyLevel] = useState<EnergyLevel>("low");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const energyResult = calculateEnergy({
      currentSessionMinutes: focusMinutesToday,
      sessionsToday: store.sessionCount,
      skippedBreaksToday: getSkippedBreaksToday(),
      funengineOpensToday: getFunEngineOpensToday(),
      streak: 0,
      hourOfDay: new Date().getHours(),
    });

    setCurrentEnergyLevel(energyResult.level);
  }, [focusMinutesToday, store.sessionCount]);

  // Soft break suggestion trigger
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!store.sessionActive || !taskStore.activeTask) return;

    const FOCUS_THRESHOLD_MS = 45 * 60 * 1000;
    const COOLDOWN_MS = 20 * 60 * 1000;

    if (store.elapsedMs < FOCUS_THRESHOLD_MS) return;
    if (currentEnergyLevel !== "high" && currentEnergyLevel !== "chaos") return;

    const lastSuggestionTime = getLastBreakSuggestionTime();
    const timeSinceLastSuggestion = Date.now() - lastSuggestionTime;

    if (timeSinceLastSuggestion < COOLDOWN_MS) return;

    setShowBreakSuggestion(true);
    setLastBreakSuggestionTime(Date.now());
  }, [store.sessionActive, taskStore.activeTask, store.elapsedMs, currentEnergyLevel]);

  const handleOpenFunEngineFromSuggestion = () => {
    setShowBreakSuggestion(false);
    setFunModalOpen(true);
    incrementFunEngineOpens();
  };

  const handleIgnoreBreakSuggestion = () => {
    setShowBreakSuggestion(false);
    incrementIgnoredBreaks();
    backendAchievements.triggerEvent("break_ignored");
  };

  const handleFunEngineUsed = () => {
    incrementFunEngineOpens();
  };

  useEffect(() => {
    setMounted(true);
    setDayStartCTA(getRandomDayStartText(locale));
    const auth = localStorage.getItem("procrastimate_auth");
    if (!auth) {
      router.push("/login");
    }
  }, [router, locale]);

  useEffect(() => {
    if (!taskStore.activeTask) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [taskStore.activeTask?.id]);

  useEffect(() => {
    if (mounted && backendAchievements.userId) {
      backendAchievements.updateStreak();
      flushEventQueue(backendAchievements.userId);
      
      if (!hasTrackedGhost.current) {
        backendAchievements.trackGhost(false);
        hasTrackedGhost.current = true;
      }
    }
  }, [mounted, backendAchievements.userId]);

  const handleUserAction = () => {
    if (backendAchievements.userId && hasTrackedGhost.current) {
      backendAchievements.trackGhost(true);
      hasTrackedGhost.current = false;
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("procrastimate_auth");
    router.push("/login");
  };

  const handleBreak = () => {
    store.takeBreak();
    setCatModalOpen(true);
    setDistractionDismissed(true);
  };

  const handleCompleteTask = (taskId: string) => {
    handleUserAction();
    store.setActiveTaskId(null);
    const task = taskStore.tasks.find((t) => t.id === taskId);
    if (!task || task.type !== "work") return;

    const targetMs = task.durationMin * 60 * 1000;
    const actualElapsed = task.startedAt ? Date.now() - task.startedAt : 0;
    const totalPausedMs = task.totalPausedMs || 0;
    const netElapsed = actualElapsed - totalPausedMs;
    const early = netElapsed < targetMs * 0.9;

    setIsEarlyCompletion(early);
    setBreakModalOpen(true);
    setPendingBreakSlot(taskId);
  };

  const getPendingElapsed = () => {
    if (!pendingBreakSlot) return 0;
    const task = taskStore.tasks.find((t) => t.id === pendingBreakSlot);
    if (!task?.startedAt) return 0;
    const actualElapsed = Date.now() - task.startedAt;
    const totalPausedMs = task.totalPausedMs || 0;
    return actualElapsed - totalPausedMs;
  };

  const handleAcceptBreak = () => {
    if (pendingBreakSlot) {
      taskStore.completeTask(pendingBreakSlot, getPendingElapsed());
      setPendingBreakSlot(null);
    }
    setBreakModalOpen(false);

    if (isEarlyCompletion) {
      window.open("https://www.youtube.com/watch?v=2MtOpB5LlUA", "_blank");
    }

    const breakSlot = taskStore.tasks.find(
      (t) => t.type === "break" && !t.completed
    );
    if (breakSlot) {
      taskStore.startTask(breakSlot.id);
    }
  };

  const handleEarlyDismiss = () => {
    if (pendingBreakSlot) {
      taskStore.completeTask(pendingBreakSlot, getPendingElapsed());
      setPendingBreakSlot(null);
    }
    setBreakModalOpen(false);
    incrementSkippedBreaks();
    backendAchievements.updateAchievement("ignore_break_10", 1);
  };


  const hasWorkTasks = taskStore.todayTasks.some((t) => t.type === "work" && t.status === "pending");
  const canStartSession = !store.sessionActive && !taskStore.activeTask && hasWorkTasks;
  const canEndSession = store.sessionActive;

  // Record session start on backend (server-side timestamp for focus_minutes)
  const handleStartSession = () => {
    const csid = crypto.randomUUID();
    setClientSessionId(csid);
    store.startSession();
    sendEventWithRetry(userId, "session_start", { client_session_id: csid });
  };

  // Auto-start workday when starting first task
  const handleStartTask = (id: string) => {
    handleUserAction();
    if (!store.sessionActive) {
      handleStartSession();
    }
    taskStore.startTask(id);
    store.setActiveTaskId(id);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <nav className="w-full border-b border-border bg-card flex-shrink-0">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ProcrastiMate
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            {t("logout")}
          </button>
        </div>
      </nav>

      {/* Main Two-Column Layout */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          {/* LEFT COLUMN - Control Panel */}
          <div className="space-y-3">
            {/* Energy Score */}
            <div className="bg-card border border-border rounded-xl p-2 flex flex-col items-center">
              <EnergyScore 
                score={showEnergyScore ? store.energyScore : Math.floor(store.todayTotalTime / 60_000)} 
                label={showEnergyScore ? t("energyInner") : "MIN"} 
                totalTime={store.todayTotalTime}
                onClick={() => setShowEnergyScore(!showEnergyScore)}
              />
              <p className="text-xs text-muted uppercase tracking-wider font-medium">
                {t("energyLabel")}
              </p>
              {!toneLoading && toneMessage && (
                <>
                  <p className={`text-xs font-semibold mt-1 text-center ${rarity === "legendary" ? "legendary" : ""}`}>
                    {rarity === "legendary" && "👑 "}{toneMessage}
                  </p>
                  <div className="w-full mt-1.5">
                    <ShareButton
                      payload={{
                        focusMinutes: focusMinutesToday,
                        breakIgnored,
                        mode: mode || "idle",
                        rarity: rarity || "common",
                        toneMessage,
                        locale: locale as "ru" | "en",
                      }}
                      label={t("shareButton")}
                      isLegendary={rarity === "legendary"}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Active Session Panel */}
            <ActiveSessionPanel
              activeTask={taskStore.activeTask}
              elapsedMs={taskStore.activeTask?.startedAt
                ? (taskStore.activeTask.pausedAt
                    ? taskStore.activeTask.pausedAt - taskStore.activeTask.startedAt - (taskStore.activeTask.totalPausedMs || 0)
                    : now - taskStore.activeTask.startedAt - (taskStore.activeTask.totalPausedMs || 0))
                : 0}
              onComplete={() => {
                if (taskStore.activeTask?.type === "work") {
                  handleCompleteTask(taskStore.activeTask.id);
                } else {
                  store.setActiveTaskId(null);
                  taskStore.completeTask(taskStore.activeTask!.id);
                }
              }}
              onPause={() => {
                if (taskStore.activeTask) {
                  handleUserAction();
                  taskStore.pauseTask(taskStore.activeTask.id);
                }
              }}
              onResume={() => {
                if (taskStore.activeTask) {
                  handleUserAction();
                  taskStore.resumeTask(taskStore.activeTask.id);
                }
              }}
            />

            {/* Action Buttons */}
            <div className="bg-card border border-border rounded-xl p-2">
              <button
                onClick={() => {
                  if (store.sessionActive) {
                    if (!canEndSession) return;
                    handleUserAction();
                    store.endSession();
                  } else {
                    if (!canStartSession) return;
                    handleUserAction();
                    handleStartSession();
                    setDayStartCTA(getRandomDayStartText(locale));
                  }
                }}
                disabled={store.sessionActive ? !canEndSession : !canStartSession}
                className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
                  store.sessionActive
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-gradient-to-r from-purple-start to-purple-end text-white hover:opacity-90"
                }`}
              >
                {store.sessionActive ? t("endSession") : dayStartCTA}
              </button>
            </div>


            {/* Mini Stats */}
            <div className="bg-card border border-border rounded-xl p-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                {t("miniStats")}
              </h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted">{t("statsFocus")}:</span>
                <span className="font-semibold text-right">{backendStats.dailySession ? `${backendStats.dailySession.focus_minutes}м` : formatTime(store.todayTotalTime)}</span>
                <span className="text-muted">{t("statsSessions")}:</span>
                <span className="font-semibold text-right">{sessionCount}</span>
                <span className="text-muted">{t("statsBreaks")}:</span>
                <span className="font-semibold text-right">{breakMinutes}м</span>
                <span className="text-muted">{t("completedTasks")}:</span>
                <span className="font-semibold text-right">{completedTasks}</span>
              </div>
            </div>

            {/* Achievements Panel */}
            <AchievementsPanel />

            {/* Fun Engine Button */}
            <button
              onClick={() => setFunModalOpen(true)}
              className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              {t("distractMe")}
            </button>

            {/* Day Review Button */}
            <button
              onClick={() => setReportOpen(true)}
              className="w-full py-2 px-4 rounded-lg border border-border text-foreground font-semibold text-xs hover:bg-border/50 transition-colors"
            >
              {t("dayReview")}
            </button>


            {/* Day Summary */}
            {daySummary && (
              <div className="p-3 bg-purple-start/10 border border-purple-start/20 rounded-lg text-center">
                <p className="text-xs text-foreground leading-relaxed">{daySummary}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Content */}
          <div className="space-y-3 pb-4">
            {/* Task List */}
            <TaskList
              tasks={taskStore.todayTasks}
              completedToday={taskStore.completedToday}
              dayClosed={taskStore.dayClosed}
              activeTask={taskStore.activeTask}
              onAddTask={(title: string, durationMin: number) => {
                handleUserAction();
                taskStore.addTask(title, durationMin);
              }}
              onStartTask={handleStartTask}
              onCompleteTask={(id) => {
                store.setActiveTaskId(null);
                taskStore.completeTask(id);
              }}
              onAbandonTask={(id) => {
                store.setActiveTaskId(null);
                taskStore.abandonTask(id);
              }}
            />

            {/* Backend Stats Panel */}
            <StatsPanel />

            {/* Justification Generator */}
            <JustificationGenerator />
          </div>
        </div>
      </main>

      {/* Cat Modal */}
      <CatModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={t("modal.title")}
        closeLabel={t("modal.close")}
      />

      {/* Break Modal */}
      <BreakModal
        open={breakModalOpen}
        isEarlyCompletion={isEarlyCompletion}
        onAccept={handleAcceptBreak}
        onDismiss={isEarlyCompletion ? handleEarlyDismiss : undefined}
      />

      {/* Destroy Day Modal */}
      <DestroyDayModal
        open={destroyDayModalOpen}
        onClose={() => setDestroyDayModalOpen(false)}
        focusMinutes={backendStats.dailySession?.focus_minutes || Math.floor(store.todayTotalTime / 60_000)}
        breakMinutes={breakMinutes}
        completedTasks={completedTasks}
      />

      {/* Fun Engine Modal */}
      <FunEngineModal
        open={funModalOpen}
        onClose={() => setFunModalOpen(false)}
        energyLevel={currentEnergyLevel}
        userId={userId}
        sessionActive={store.sessionActive}
        onStatsRefresh={backendStats.refreshStats}
        onBreakStart={() => {
          backendAchievements.triggerEvent("break_start", { client_session_id: clientSessionId }).catch((e) =>
            console.error("[event] break_start failed:", e)
          );
        }}
        onBreakEnd={async () => {
          await backendAchievements.triggerEvent("break_end", { client_session_id: clientSessionId });
        }}
      />

      {/* Day Review Modal */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg">{t("dayReview")}</h3>
              <button
                onClick={() => setReportOpen(false)}
                className="text-muted hover:text-foreground transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-4 border-b border-border flex gap-2">
              <button
                onClick={() => setReportMode("self")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  reportMode === "self"
                    ? "bg-gradient-to-r from-purple-start to-purple-end text-white"
                    : "border border-border text-foreground hover:bg-border/50"
                }`}
              >
                {t("forMe")}
              </button>
              <button
                onClick={() => setReportMode("employer")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  reportMode === "employer"
                    ? "bg-gradient-to-r from-purple-start to-purple-end text-white"
                    : "border border-border text-foreground hover:bg-border/50"
                }`}
              >
                {t("forReport")}
              </button>
            </div>

            <div className="p-6">
              <SelfReportPanel mode={reportMode} />
            </div>
          </div>
        </div>
      )}

      {/* Break Suggestion Bar */}
      {showBreakSuggestion && (
        <BreakSuggestionBar
          onOpenFunEngine={handleOpenFunEngineFromSuggestion}
          onIgnore={handleIgnoreBreakSuggestion}
        />
      )}
    </div>
  );
}

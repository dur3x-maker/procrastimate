"use client";

import { useState, useEffect, useCallback } from "react";
import { achievements, type Achievement } from "@/config/achievementsConfig";

const STORAGE_KEY = "achievements_v2";
const STREAK_STORAGE_KEY = "achievements_streak_v1";
const BEHAVIOR_STORAGE_KEY = "achievements_behavior_v1";

const STREAK_ACHIEVEMENT_IDS = ["streak_3_days", "streak_7_days", "streak_30_days"];

export interface AchievementProgress {
  id: string;
  progress: number;
  unlocked: boolean;
}

export interface AchievementWithProgress extends Achievement {
  progress: number;
  unlocked: boolean;
  visible: boolean;
}

export interface UnlockResult {
  unlockedNow: boolean;
  achievement?: Achievement;
}

interface StreakData {
  lastActiveDate: string;
  currentStreak: number;
}

interface BehaviorData {
  ghostSessions: number;
  lastOpenDate: string;
}

interface StorageData {
  [key: string]: AchievementProgress;
}

function isValidProgressData(data: unknown): data is AchievementProgress {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.progress === "number" &&
    typeof obj.unlocked === "boolean"
  );
}

function loadFromStorage(): StorageData {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};
    
    const validated: StorageData = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isValidProgressData(value)) {
        validated[key] = value;
      }
    }
    
    return validated;
  } catch {
    return {};
  }
}

function saveToStorage(data: StorageData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save achievements:", error);
  }
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { lastActiveDate: "", currentStreak: 0 };
  }

  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!stored) return { lastActiveDate: "", currentStreak: 0 };

    const parsed = JSON.parse(stored);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.lastActiveDate === "string" &&
      typeof parsed.currentStreak === "number"
    ) {
      return parsed;
    }
    return { lastActiveDate: "", currentStreak: 0 };
  } catch {
    return { lastActiveDate: "", currentStreak: 0 };
  }
}

function saveStreakData(data: StreakData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save streak data:", error);
  }
}

function loadBehaviorData(): BehaviorData {
  if (typeof window === "undefined") {
    return { ghostSessions: 0, lastOpenDate: "" };
  }

  try {
    const stored = localStorage.getItem(BEHAVIOR_STORAGE_KEY);
    if (!stored) return { ghostSessions: 0, lastOpenDate: "" };

    const parsed = JSON.parse(stored);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.ghostSessions === "number" &&
      typeof parsed.lastOpenDate === "string"
    ) {
      return parsed;
    }
    return { ghostSessions: 0, lastOpenDate: "" };
  } catch {
    return { ghostSessions: 0, lastOpenDate: "" };
  }
}

function saveBehaviorData(data: BehaviorData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BEHAVIOR_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save behavior data:", error);
  }
}

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day, 0, 0, 0, 0);
}

function diffInDays(dateA: string, dateB: string): number {
  const a = parseLocalDate(dateA);
  const b = parseLocalDate(dateB);
  
  if (!a || !b) return 0;
  
  const diffTime = b.getTime() - a.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 0;
  
  return diffDays;
}

function isAchievementUnlocked(progress: number, achievement: Achievement): boolean {
  return progress >= achievement.target;
}

export function useAchievements() {
  const [progressData, setProgressData] = useState<StorageData>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    setProgressData(stored);
    setMounted(true);
  }, []);

  const getAllAchievementsWithProgress = useCallback((): AchievementWithProgress[] => {
    return achievements.map((achievement) => {
      const progress = progressData[achievement.id] || {
        id: achievement.id,
        progress: 0,
        unlocked: false,
      };

      const visible = !achievement.hidden || progress.unlocked;

      return {
        ...achievement,
        progress: progress.progress,
        unlocked: progress.unlocked,
        visible,
      };
    });
  }, [progressData]);

  const updateAchievement = useCallback((id: string, value: number): UnlockResult => {
    const achievement = achievements.find((a) => a.id === id);
    if (!achievement) {
      console.warn(`Achievement ${id} not found`);
      return { unlockedNow: false };
    }

    const latestSnapshot = loadFromStorage();
    
    const current = latestSnapshot[id] || {
      id,
      progress: 0,
      unlocked: false,
    };

    if (current.unlocked) {
      return { unlockedNow: false };
    }

    const newProgress = current.progress + value;
    const nowUnlocked = isAchievementUnlocked(newProgress, achievement);
    const wasUnlocked = current.unlocked;

    const nextSnapshot = {
      ...latestSnapshot,
      [id]: {
        id,
        progress: newProgress,
        unlocked: nowUnlocked,
      },
    };

    saveToStorage(nextSnapshot);
    setProgressData(nextSnapshot);

    return {
      unlockedNow: nowUnlocked && !wasUnlocked,
      achievement: nowUnlocked && !wasUnlocked ? achievement : undefined,
    };
  }, []);

  const updateDailyStreak = useCallback((): UnlockResult[] => {
    const today = getTodayString();
    const streakData = loadStreakData();

    const daysDiff = diffInDays(streakData.lastActiveDate, today);

    if (daysDiff === 0) {
      return [];
    }

    const previousStreak = streakData.currentStreak;
    const newStreak = daysDiff === 1 ? streakData.currentStreak + 1 : 1;

    const updatedStreakData: StreakData = {
      lastActiveDate: today,
      currentStreak: newStreak,
    };

    saveStreakData(updatedStreakData);

    const latestSnapshot = loadFromStorage();
    let nextSnapshot = { ...latestSnapshot };
    const results: UnlockResult[] = [];

    STREAK_ACHIEVEMENT_IDS.forEach((id) => {
      const achievement = achievements.find((a) => a.id === id);
      if (!achievement) return;

      const current = nextSnapshot[id] || {
        id,
        progress: 0,
        unlocked: false,
      };

      if (current.unlocked) return;

      const nowUnlocked = isAchievementUnlocked(newStreak, achievement);
      const wasUnlocked = current.unlocked;

      nextSnapshot = {
        ...nextSnapshot,
        [id]: {
          id,
          progress: newStreak,
          unlocked: nowUnlocked,
        },
      };

      if (nowUnlocked && !wasUnlocked) {
        results.push({
          unlockedNow: true,
          achievement,
        });
      }
    });

    if (daysDiff >= 7 && streakData.lastActiveDate) {
      const comebackAchievement = achievements.find((a) => a.id === "comeback_7_days");
      if (comebackAchievement) {
        const comebackCurrent = nextSnapshot["comeback_7_days"] || {
          id: "comeback_7_days",
          progress: 0,
          unlocked: false,
        };

        if (!comebackCurrent.unlocked) {
          const comebackProgress = comebackCurrent.progress + 1;
          const comebackUnlocked = isAchievementUnlocked(comebackProgress, comebackAchievement);

          nextSnapshot = {
            ...nextSnapshot,
            comeback_7_days: {
              id: "comeback_7_days",
              progress: comebackProgress,
              unlocked: comebackUnlocked,
            },
          };

          if (comebackUnlocked && !comebackCurrent.unlocked) {
            results.push({
              unlockedNow: true,
              achievement: comebackAchievement,
            });
          }
        }
      }
    }

    if (previousStreak >= 7 && daysDiff > 1) {
      const relapseAchievement = achievements.find((a) => a.id === "relapse_break_streak");
      if (relapseAchievement) {
        const relapseCurrent = nextSnapshot["relapse_break_streak"] || {
          id: "relapse_break_streak",
          progress: 0,
          unlocked: false,
        };

        if (!relapseCurrent.unlocked) {
          const relapseProgress = relapseCurrent.progress + 1;
          const relapseUnlocked = isAchievementUnlocked(relapseProgress, relapseAchievement);

          nextSnapshot = {
            ...nextSnapshot,
            relapse_break_streak: {
              id: "relapse_break_streak",
              progress: relapseProgress,
              unlocked: relapseUnlocked,
            },
          };

          if (relapseUnlocked && !relapseCurrent.unlocked) {
            results.push({
              unlockedNow: true,
              achievement: relapseAchievement,
            });
          }
        }
      }
    }

    saveToStorage(nextSnapshot);
    setProgressData(nextSnapshot);

    return results;
  }, []);

  const trackGhostOpen = useCallback((didUserPerformAction: boolean): UnlockResult[] => {
    const behaviorData = loadBehaviorData();
    const today = getTodayString();

    let newGhostSessions: number;
    if (didUserPerformAction) {
      newGhostSessions = 0;
    } else {
      if (behaviorData.lastOpenDate === today) {
        newGhostSessions = behaviorData.ghostSessions;
      } else {
        newGhostSessions = behaviorData.ghostSessions + 1;
      }
    }

    const updatedBehaviorData: BehaviorData = {
      ghostSessions: newGhostSessions,
      lastOpenDate: today,
    };

    saveBehaviorData(updatedBehaviorData);

    const results: UnlockResult[] = [];

    if (newGhostSessions >= 5 && behaviorData.ghostSessions < 5) {
      const latestSnapshot = loadFromStorage();
      const ghostAchievement = achievements.find((a) => a.id === "ghost_mode_5");
      
      if (ghostAchievement) {
        const ghostCurrent = latestSnapshot["ghost_mode_5"] || {
          id: "ghost_mode_5",
          progress: 0,
          unlocked: false,
        };

        if (!ghostCurrent.unlocked) {
          const ghostProgress = ghostCurrent.progress + 1;
          const ghostUnlocked = isAchievementUnlocked(ghostProgress, ghostAchievement);

          const nextSnapshot = {
            ...latestSnapshot,
            ghost_mode_5: {
              id: "ghost_mode_5",
              progress: ghostProgress,
              unlocked: ghostUnlocked,
            },
          };

          saveToStorage(nextSnapshot);
          setProgressData(nextSnapshot);

          if (ghostUnlocked && !ghostCurrent.unlocked) {
            results.push({
              unlockedNow: true,
              achievement: ghostAchievement,
            });
          }
        }
      }
    }

    return results;
  }, []);

  const resetAchievements = useCallback(() => {
    setProgressData({});
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STREAK_STORAGE_KEY);
      localStorage.removeItem(BEHAVIOR_STORAGE_KEY);
    }
  }, []);

  return {
    getAllAchievementsWithProgress,
    updateAchievement,
    updateDailyStreak,
    trackGhostOpen,
    resetAchievements,
    mounted,
  };
}

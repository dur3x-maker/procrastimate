"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type DailySession, type AggregatedStats } from "@/lib/api";
import { getUserId } from "@/lib/userId";

export function useBackendStats() {
  const [dailySession, setDailySession] = useState<DailySession | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  const fetchDailySession = useCallback(async () => {
    if (!userId) return;
    
    try {
      const session = await api.getDailySession(userId);
      setDailySession(session);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch daily session:", error);
      }
      setDailySession(null);
    }
  }, [userId]);

  const fetchWeeklyStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const stats = await api.getAggregatedStats(userId, 'weekly');
      setWeeklyStats(stats);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch weekly stats:", error);
      }
      setWeeklyStats(null);
    }
  }, [userId]);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDailySession(), fetchWeeklyStats()]);
    setLoading(false);
  }, [fetchDailySession, fetchWeeklyStats]);

  useEffect(() => {
    if (userId) {
      refreshStats();
    }
  }, [userId, refreshStats]);

  return {
    dailySession,
    weeklyStats,
    loading,
    refreshStats,
    fetchDailySession,
    fetchWeeklyStats,
  };
}

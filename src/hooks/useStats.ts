"use client";

import { useState, useEffect } from "react";
import { fetchStats, SessionStats } from "@/api/session";
import { getUserId } from "@/lib/userId";

export type StatsRange = "weekly" | "monthly";

export interface UseStatsReturn {
  data: SessionStats | null;
  loading: boolean;
  error: string | null;
  setRange: (range: StatsRange) => void;
}

export function useStats(initialRange: StatsRange = "weekly"): UseStatsReturn {
  const [range, setRange] = useState<StatsRange>(initialRange);
  const [data, setData] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setError("No user ID found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    let isActive = true;

    fetchStats(userId, range)
      .then((stats) => {
        if (isActive) {
          setData(stats);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isActive) {
          console.error("[useStats] Failed to fetch stats:", err);
          setError("Failed to load statistics");
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [range]);

  return {
    data,
    loading,
    error,
    setRange,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type AchievementProgress } from "@/lib/api";
import { getUserId } from "@/lib/userId";
import { showToast } from "@/lib/toast";

export function useBackendAchievements() {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await api.getAchievements(userId);
      setAchievements(data);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      showToast({ message: "Failed to load achievements", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId, fetchAchievements]);

  const updateAchievement = useCallback(
    async (achievementId: string, value: number) => {
      if (!userId) return;

      try {
        const result = await api.updateAchievement(userId, achievementId, value);
        
        if (result.unlocked_now && result.achievement_id) {
          showToast({
            message: `🎉 Achievement unlocked: ${result.achievement_id}`,
            type: "success",
            duration: 5000,
          });
          await fetchAchievements();
        }
        
        return result;
      } catch (error) {
        console.error("Failed to update achievement:", error);
        showToast({ message: "Failed to update achievement", type: "error" });
      }
    },
    [userId, fetchAchievements]
  );

  const updateStreak = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await api.updateStreak(userId);
      
      if (result.unlocked_achievements.length > 0) {
        for (const unlock of result.unlocked_achievements) {
          if (unlock.unlocked_now && unlock.achievement_id) {
            showToast({
              message: `🎉 Achievement unlocked: ${unlock.achievement_id}`,
              type: "success",
              duration: 5000,
            });
          }
        }
        await fetchAchievements();
      }
      
      return result;
    } catch (error) {
      console.error("Failed to update streak:", error);
    }
  }, [userId, fetchAchievements]);

  const trackGhost = useCallback(
    async (didUserPerformAction: boolean) => {
      if (!userId) return;

      try {
        const result = await api.trackGhost(userId, didUserPerformAction);
        
        if (result.unlocked_achievements.length > 0) {
          for (const unlock of result.unlocked_achievements) {
            if (unlock.unlocked_now && unlock.achievement_id) {
              showToast({
                message: `🎉 Achievement unlocked: ${unlock.achievement_id}`,
                type: "success",
                duration: 5000,
              });
            }
          }
          await fetchAchievements();
        }
        
        return result;
      } catch (error) {
        console.error("Failed to track ghost:", error);
      }
    },
    [userId, fetchAchievements]
  );

  const triggerEvent = useCallback(
    async (event: string, metadata?: Record<string, any>) => {
      if (!userId) return;

      try {
        const result = await api.triggerAchievementEvent(userId, event, metadata);
        
        if (result.unlocked_achievements.length > 0) {
          for (const unlock of result.unlocked_achievements) {
            if (unlock.unlocked_now && unlock.achievement_id) {
              showToast({
                message: `🎉 Achievement unlocked: ${unlock.achievement_id}`,
                type: "success",
                duration: 5000,
              });
            }
          }
          await fetchAchievements();
        }
        
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to trigger achievement event:", error);
        }
      }
    },
    [userId, fetchAchievements]
  );

  return {
    achievements,
    loading,
    userId,
    updateAchievement,
    updateStreak,
    trackGhost,
    triggerEvent,
    refreshAchievements: fetchAchievements,
  };
}

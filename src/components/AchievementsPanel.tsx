"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useBackendAchievements } from "@/hooks/useBackendAchievements";
import { achievements as achievementMetadata } from "@/config/achievementsConfig";

export function AchievementsPanel() {
  const { achievements, loading } = useBackendAchievements();
  const t = useTranslations("dashboard.achievements");
  const [showAllModal, setShowAllModal] = useState(false);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievementMetadata.length;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          {t("title")}
        </h3>
        <p className="text-sm text-muted">{t("loading")}</p>
      </div>
    );
  }

  const renderAchievement = (achievement: any, metadata: any) => {
    const isLegendary = metadata.legendary || false;
    
    return (
      <div
        key={achievement.id}
        className={`p-2 rounded-lg border transition-all ${
          achievement.unlocked
            ? isLegendary
              ? "border-purple-500 bg-purple-500/10"
              : "border-green-500 bg-green-500/10"
            : "border-border bg-background opacity-60"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold">
            {achievement.unlocked && "✅ "}
            {isLegendary && "👑 "}
            {metadata.title}
          </span>
          <span className="text-xs text-muted">
            {achievement.progress} / {metadata.target}
          </span>
        </div>
        <p className="text-xs text-muted mb-1">{metadata.description}</p>
        <div className="w-full bg-border rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              achievement.unlocked
                ? isLegendary
                  ? "bg-purple-500"
                  : "bg-green-500"
                : "bg-muted"
            }`}
            style={{
              width: `${Math.min(100, (achievement.progress / metadata.target) * 100)}%`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            {t("title")} ({unlockedCount}/{totalCount})
          </h3>
          <button
            onClick={() => setShowAllModal(true)}
            className="text-xs text-purple-start hover:text-purple-end transition-colors"
          >
            Все →
          </button>
        </div>
        <div className="space-y-1">
          {achievements.slice(0, 3).map((achievement) => {
            const metadata = achievementMetadata.find(a => a.id === achievement.achievement_id);
            if (!metadata) return null;
            return renderAchievement(achievement, metadata);
          })}
        </div>
      </div>

      {/* All Achievements Modal */}
      {showAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg">
                {t("title")} ({unlockedCount}/{totalCount})
              </h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-muted hover:text-foreground transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-2">
                {achievementMetadata.map((metadata) => {
                  const achievement = achievements.find(a => a.achievement_id === metadata.id) || {
                    id: metadata.id,
                    user_id: '',
                    achievement_id: metadata.id,
                    progress: 0,
                    unlocked: false,
                    updated_at: ''
                  };
                  return renderAchievement(achievement, metadata);
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

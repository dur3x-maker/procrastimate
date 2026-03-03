"use client";

import { useTranslations } from "next-intl";

interface BreakSuggestionBarProps {
  onOpenFunEngine: () => void;
  onIgnore: () => void;
}

export function BreakSuggestionBar({ onOpenFunEngine, onIgnore }: BreakSuggestionBarProps) {
  const t = useTranslations("breakSuggestion");

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-card border border-orange-500/50 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {t("message")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenFunEngine}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t("openDistractions")}
          </button>
          <button
            onClick={onIgnore}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-border/50 transition-colors"
          >
            {t("ignore")}
          </button>
        </div>
      </div>
    </div>
  );
}

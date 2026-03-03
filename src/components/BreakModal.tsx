"use client";

import { useTranslations } from "next-intl";

const TUMBLEWEEDS = ["🌵", "🌾", "🍂", "🌿", "🍃"];

function randomTumbleweed(): string {
  return TUMBLEWEEDS[Math.floor(Math.random() * TUMBLEWEEDS.length)];
}

interface BreakModalProps {
  open: boolean;
  isEarlyCompletion: boolean;
  onAccept: () => void;
  onDismiss?: () => void;
}

export function BreakModal({ open, isEarlyCompletion, onAccept, onDismiss }: BreakModalProps) {
  const t = useTranslations("breakModal");
  const tumbleweed = randomTumbleweed();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={isEarlyCompletion ? onDismiss : undefined}
    >
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isEarlyCompletion && onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-muted hover:text-foreground text-xl leading-none"
          >
            &times;
          </button>
        )}
        <div className="text-5xl mb-4">
          {isEarlyCompletion ? tumbleweed : "☕"}
        </div>
        <p className="text-base leading-relaxed mb-6">
          {isEarlyCompletion ? t("earlyText", { tumbleweed }) : t("timeoutText")}
        </p>
        <button
          onClick={onAccept}
          className="w-full py-3 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {isEarlyCompletion ? t("earlyButton") : t("timeoutButton")}
        </button>
        {isEarlyCompletion && onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-3 w-full py-2 rounded-full border border-border text-sm text-muted hover:bg-border/50 transition-colors"
          >
            {t("earlyDismiss")}
          </button>
        )}
      </div>
    </div>
  );
}

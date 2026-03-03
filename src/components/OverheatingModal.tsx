"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFunEngine } from "@/hooks/useFunEngine";
import type { EnergyLevel } from "@/lib/energy";

const TUMBLEWEEDS = ["🌵", "🌾", "🍂", "🌿", "🍃"];

function randomTumbleweed(): string {
  return TUMBLEWEEDS[Math.floor(Math.random() * TUMBLEWEEDS.length)];
}

function getRandomIndex(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

interface OverheatingModalProps {
  open: boolean;
  energyLevel: EnergyLevel;
  onClose: () => void;
  onResisted: () => void;
  onFunEngineUsed: () => void;
}

export function OverheatingModal({
  open,
  energyLevel,
  onClose,
  onResisted,
  onFunEngineUsed,
}: OverheatingModalProps) {
  const tOverheating = useTranslations("overheating");
  const tTone = useTranslations("tone.absurd");
  const tBreak = useTranslations("break");
  const [selectedOption, setSelectedOption] = useState<"video" | "absurd" | "break" | null>(null);
  const [absurdMessage, setAbsurdMessage] = useState<string | null>(null);
  const [breakMessage, setBreakMessage] = useState<string | null>(null);
  const { content, loading, error, loadContent } = useFunEngine();

  const isChaos = energyLevel === "chaos";

  const handleVideoClick = async () => {
    setSelectedOption("video");
    onFunEngineUsed();
    await loadContent(energyLevel);
  };

  const handleAbsurdClick = () => {
    setSelectedOption("absurd");
    onFunEngineUsed();
    const randomIndex = getRandomIndex(16);
    setAbsurdMessage(tTone(randomIndex.toString()));
  };

  const handleBreakClick = () => {
    setSelectedOption("break");
    onFunEngineUsed();
    const breakType = energyLevel === "chaos" ? "long" : "medium";
    const randomIndex = getRandomIndex(10);
    setBreakMessage(tBreak(`${breakType}.${randomIndex}`));
  };

  const handleCloseWithResist = () => {
    onResisted();
    onClose();
  };

  if (!open) return null;

  if (selectedOption === "video") {
    if (loading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-sm text-muted">{tOverheating("loadingVideo")}</p>
          </div>
        </div>
      );
    }

    if (error || !content) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
            <div className="text-5xl mb-4">{randomTumbleweed()}</div>
            <p className="text-sm text-muted mb-4">{tOverheating("videoFallback")}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {tOverheating("close")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{tOverheating("videoTitle")}</h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-purple-500/30 mb-4">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-sm text-muted mb-4">{tOverheating("noEmbed")}</p>
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {tOverheating("openVideo")}
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-border text-sm font-medium hover:bg-border/50 transition-colors"
          >
            {tOverheating("close")}
          </button>
        </div>
      </div>
    );
  }

  if (selectedOption === "absurd" && absurdMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
          <div className="text-5xl mb-4">🤯</div>
          <p className="text-base leading-relaxed mb-6">{absurdMessage}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {tOverheating("close")}
          </button>
        </div>
      </div>
    );
  }

  if (selectedOption === "break" && breakMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
          <div className="text-5xl mb-4">🧘</div>
          <p className="text-base leading-relaxed mb-6">{breakMessage}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {tOverheating("close")}
          </button>
        </div>
      </div>
    );
  }

  const title = isChaos ? tOverheating("chaosTitle") : tOverheating("highTitle");
  const subtitle = isChaos ? tOverheating("chaosSubtitle") : tOverheating("highSubtitle");
  const emoji = isChaos ? "🔥" : "⚠️";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center ${
          isChaos ? "border-2 border-red-500/50" : ""
        }`}
      >
        <div className="text-5xl mb-4">{emoji}</div>
        <h3 className={`text-xl font-bold mb-2 ${isChaos ? "text-red-500" : ""}`}>{title}</h3>
        <p className="text-sm text-muted mb-6">{subtitle}</p>

        <div className="space-y-3">
          <button
            onClick={handleBreakClick}
            className="w-full py-3 rounded-lg border-2 border-border text-foreground font-semibold hover:bg-border/50 transition-colors"
          >
            {tOverheating("bodyReset")}
          </button>

          <button
            onClick={handleAbsurdClick}
            className="w-full py-3 rounded-lg border-2 border-border text-foreground font-semibold hover:bg-border/50 transition-colors"
          >
            {tOverheating("absurd")}
          </button>

          <button
            onClick={handleVideoClick}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {tOverheating("video")}
          </button>

          <button
            onClick={handleCloseWithResist}
            className="w-full py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            {tOverheating("resist")}
          </button>
        </div>
      </div>
    </div>
  );
}

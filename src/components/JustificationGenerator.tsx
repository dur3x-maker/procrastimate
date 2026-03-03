"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getRandomExcuses, mapEnergyToAbsurdLevel, type Excuse } from "@/lib/excuseGenerator";

export function JustificationGenerator() {
  const t = useTranslations("justification");
  const locale = useLocale();
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(5);
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const handleGenerate = () => {
    if (!description.trim()) return;
    
    const absurdLevelRange = mapEnergyToAbsurdLevel(
      level <= 3 ? "low" : level <= 6 ? "medium" : level <= 8 ? "high" : "chaos"
    );
    
    const generated = getRandomExcuses({
      locale,
      count: 2,
      ...absurdLevelRange,
    });
    
    setExcuses(generated);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-3">
      <h2 className="text-base font-bold mb-1.5">{t("title")}</h2>
      
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("descriptionLabel")}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-start/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("levelLabel")}: <span className="font-bold text-purple-start">{level}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-purple-start"
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>{t("levelMin")}</span>
            <span>{t("levelMax")}</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!description.trim()}
          className="w-full py-2 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("generateButton")}
        </button>
      </div>

      {excuses.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs font-medium text-muted mb-1">{t("resultsTitle")}</p>
          {excuses.map((excuse, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-background border border-border rounded-lg hover:border-purple-start/50 transition-colors"
            >
              <div className="flex-1">
                <span className="text-sm">{excuse.text}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-muted">Absurd: {excuse.absurdLevel}</span>
                  <span className="text-xs text-muted">Surreal: {excuse.surrealLevel}</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(excuse.text, idx)}
                className="ml-3 px-3 py-1 text-xs font-medium rounded-md bg-purple-start/10 text-purple-start hover:bg-purple-start/20 transition-colors"
              >
                {copied === idx ? t("copied") : t("copy")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

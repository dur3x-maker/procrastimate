"use client";

import { useState, useEffect } from "react";
import { getToneMessage, loadTonePack, detectToneMode, type TonePack, type ToneMetrics, type ToneMode, type ToneRarity } from "@/utils/toneEngine";

export function useToneEngine(locale: string, metrics: ToneMetrics) {
  const [toneMessage, setToneMessage] = useState<string>("");
  const [tonePack, setTonePack] = useState<TonePack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState<ToneMode | null>(null);
  const [currentRarity, setCurrentRarity] = useState<ToneRarity | null>(null);

  // Load tone pack on mount or locale change
  useEffect(() => {
    let mounted = true;

    async function loadPack() {
      try {
        setIsLoading(true);
        const pack = await loadTonePack(locale);
        if (mounted) {
          setTonePack(pack);
        }
      } catch (error) {
        console.error("Failed to load tone pack:", error);
        if (mounted) {
          setTonePack(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadPack();

    return () => {
      mounted = false;
    };
  }, [locale]);

  // Generate tone message when metrics change or pack loads
  useEffect(() => {
    if (!tonePack || isLoading) return;

    const mode = detectToneMode(metrics);
    setCurrentMode(mode);
    const messageObj = getToneMessage(tonePack, metrics);
    setToneMessage(messageObj.text);
    setCurrentRarity(messageObj.rarity);
  }, [tonePack, metrics.focusMinutesToday, metrics.focusSessions, metrics.breakIgnored, metrics.completedTasks, isLoading]);

  return { toneMessage, isLoading, mode: currentMode, rarity: currentRarity };
}

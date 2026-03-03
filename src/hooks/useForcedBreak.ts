"use client";

import { useState, useEffect } from "react";
import type { ToneMode } from "@/utils/toneEngine";

const KEYS = {
  forcedBreakTriggeredDate: "pm_forcedBreakTriggeredDate",
  forcedBreakSnoozeUntil: "pm_forcedBreakSnoozeUntil",
} as const;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export interface ForcedBreakState {
  shouldShowModal: boolean;
  mode: ToneMode | null;
  closeModal: () => void;
  snooze: () => void;
  startBreak: () => void;
}

export function useForcedBreak(mode: ToneMode | null): ForcedBreakState {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<ToneMode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mode) return;

    const isOverheatedOrAbsurd = mode === "overheating" || mode === "absurd";
    if (!isOverheatedOrAbsurd) {
      setShouldShowModal(false);
      return;
    }

    const today = todayStr();
    const triggeredDate = localStorage.getItem(KEYS.forcedBreakTriggeredDate);
    const snoozeUntilStr = localStorage.getItem(KEYS.forcedBreakSnoozeUntil);

    const alreadyTriggeredToday = triggeredDate === today;
    if (alreadyTriggeredToday) {
      return;
    }

    const now = Date.now();
    const snoozeUntil = snoozeUntilStr ? Number(snoozeUntilStr) : 0;
    const isStillSnoozed = snoozeUntil > now;

    if (isStillSnoozed) {
      return;
    }

    setCurrentMode(mode);
    setShouldShowModal(true);
    localStorage.setItem(KEYS.forcedBreakTriggeredDate, today);

    if ("Notification" in window && Notification.permission === "granted") {
      const message = mode === "absurd" 
        ? "CRITICAL: forced cooldown initiated."
        : "System intervention: cooldown recommended.";
      new Notification("ProcrastiMate", { body: message });
    }
  }, [mode]);

  const closeModal = () => {
    setShouldShowModal(false);
  };

  const snooze = () => {
    const snoozeUntil = Date.now() + 15 * 60 * 1000;
    localStorage.setItem(KEYS.forcedBreakSnoozeUntil, String(snoozeUntil));
    setShouldShowModal(false);
  };

  const startBreak = () => {
    setShouldShowModal(false);
  };

  return {
    shouldShowModal,
    mode: currentMode,
    closeModal,
    snooze,
    startBreak,
  };
}

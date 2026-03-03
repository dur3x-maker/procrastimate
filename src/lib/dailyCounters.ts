const KEYS = {
  funengineOpensToday: "pm_funengineOpensToday",
  resistedDistractionsToday: "pm_resistedDistractionsToday",
  skippedBreaksToday: "pm_skippedBreaksToday",
  ignoredBreaksToday: "pm_ignoredBreaksToday",
  lastBreakSuggestionTime: "pm_lastBreakSuggestionTime",
} as const;

function readNum(key: string): number {
  if (typeof window === "undefined") return 0;
  const val = Number(localStorage.getItem(key) || "0");
  return isNaN(val) ? 0 : val;
}

function writeNum(key: string, val: number) {
  localStorage.setItem(key, String(val));
}

export function incrementFunEngineOpens(): void {
  const current = readNum(KEYS.funengineOpensToday);
  writeNum(KEYS.funengineOpensToday, current + 1);
}

export function incrementResistedDistractions(): void {
  const current = readNum(KEYS.resistedDistractionsToday);
  writeNum(KEYS.resistedDistractionsToday, current + 1);
}

export function incrementSkippedBreaks(): void {
  const current = readNum(KEYS.skippedBreaksToday);
  writeNum(KEYS.skippedBreaksToday, current + 1);
}

export function getFunEngineOpensToday(): number {
  return readNum(KEYS.funengineOpensToday);
}

export function getResistedDistractionsToday(): number {
  return readNum(KEYS.resistedDistractionsToday);
}

export function getSkippedBreaksToday(): number {
  return readNum(KEYS.skippedBreaksToday);
}

export function incrementIgnoredBreaks(): void {
  const current = readNum(KEYS.ignoredBreaksToday);
  writeNum(KEYS.ignoredBreaksToday, current + 1);
}

export function getIgnoredBreaksToday(): number {
  return readNum(KEYS.ignoredBreaksToday);
}

export function getLastBreakSuggestionTime(): number {
  return readNum(KEYS.lastBreakSuggestionTime);
}

export function setLastBreakSuggestionTime(timestamp: number): void {
  writeNum(KEYS.lastBreakSuggestionTime, timestamp);
}

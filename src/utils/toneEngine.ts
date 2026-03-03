export type ToneMode = "idle" | "moderate" | "overheating" | "absurd";
export type ToneRarity = "common" | "rare" | "legendary";

export interface TonePack {
  idle: { common: string[]; rare: string[]; legendary: string[] };
  moderate: { common: string[]; rare: string[]; legendary: string[] };
  overheating: { common: string[]; rare: string[]; legendary: string[] };
  absurd: { common: string[]; rare: string[]; legendary: string[] };
}

export interface ToneMetrics {
  focusMinutesToday: number;
  focusSessions: number;
  breakIgnored: number;
  completedTasks: number;
}

/**
 * Determine the tone mode based on user metrics
 * Priority: absurd > overheating > moderate > idle
 */
export function detectToneMode(metrics: ToneMetrics): ToneMode {
  const { focusMinutesToday, focusSessions, breakIgnored, completedTasks } = metrics;

  // absurd: highest priority
  if (focusMinutesToday >= 180 || focusSessions >= 10 || breakIgnored >= 3) {
    return "absurd";
  }

  // overheating
  if (focusMinutesToday > 80 || focusSessions >= 2 || breakIgnored >= 1) {
    return "overheating";
  }

  // moderate
  if (focusMinutesToday > 0 && focusMinutesToday <= 80) {
    return "moderate";
  }

  // idle: default
  return "idle";
}

/**
 * Select a rarity tier using weighted random
 * 70% common, 25% rare, 5% legendary
 */
export function selectRarity(): ToneRarity {
  const rand = Math.random() * 100;
  
  if (rand < 70) return "common";
  if (rand < 95) return "rare";
  return "legendary";
}

/**
 * Get a random phrase from an array
 */
function getRandomPhrase(phrases: string[]): string {
  if (phrases.length === 0) return "";
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export interface ToneMessage {
  text: string;
  mode: ToneMode;
  rarity: ToneRarity;
}

/**
 * Main tone engine function
 * Returns a tone message object with text, mode, and rarity
 */
export function getToneMessage(tonePack: TonePack, metrics: ToneMetrics): ToneMessage {
  const mode = detectToneMode(metrics);
  const rarity = selectRarity();
  
  const phrases = tonePack[mode][rarity];
  const text = getRandomPhrase(phrases);
  
  return { text, mode, rarity };
}

/**
 * Load tone pack for a specific locale
 */
export async function loadTonePack(locale: string): Promise<TonePack> {
  const response = await fetch(`/messages/tonePack/${locale}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load tone pack for locale: ${locale}`);
  }
  return response.json();
}

export type EnergyLevel = "low" | "mid" | "high" | "chaos";

export interface EnergyInput {
  currentSessionMinutes: number;
  sessionsToday: number;
  skippedBreaksToday: number;
  funengineOpensToday: number;
  streak: number;
  hourOfDay: number;
}

export interface EnergyResult {
  score: number;
  level: EnergyLevel;
}

export function calculateEnergy(input: EnergyInput): EnergyResult {
  const {
    currentSessionMinutes,
    sessionsToday,
    skippedBreaksToday,
    funengineOpensToday,
    streak,
    hourOfDay,
  } = input;

  let score =
    (currentSessionMinutes / 60) * 0.4 +
    sessionsToday * 0.3 +
    skippedBreaksToday * 0.2 +
    funengineOpensToday * 0.1;

  if (hourOfDay >= 22) {
    score += 1;
  }

  if (streak > 7) {
    score += 0.5;
  }

  const averageSessionLength =
    sessionsToday > 0 ? currentSessionMinutes / sessionsToday : 0;
  if (averageSessionLength > 90) {
    score += 0.5;
  }

  let level: EnergyLevel;
  if (score < 2) {
    level = "low";
  } else if (score < 4) {
    level = "mid";
  } else if (score < 6) {
    level = "high";
  } else {
    level = "chaos";
  }

  return { score, level };
}

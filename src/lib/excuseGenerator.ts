import ruExcuses from "@/data/excuses/ru.json";
import enExcuses from "@/data/excuses/en.json";

export interface Excuse {
  text: string;
  absurdLevel: number;
  surrealLevel: number;
}

export interface ExcuseGeneratorOptions {
  locale?: string;
  count?: number;
  minAbsurdLevel?: number;
  maxAbsurdLevel?: number;
  minSurrealLevel?: number;
  maxSurrealLevel?: number;
}

const HISTORY_SIZE = 10;
const excuseHistory: Set<number> = new Set();

const excuseData: Record<string, Excuse[]> = {
  ru: ruExcuses as Excuse[],
  en: enExcuses as Excuse[],
};

function getExcusesForLocale(locale: string): Excuse[] {
  const normalizedLocale = locale.toLowerCase().startsWith("ru") ? "ru" : "en";
  return excuseData[normalizedLocale] || excuseData.en;
}

function filterExcuses(
  excuses: Excuse[],
  options: ExcuseGeneratorOptions
): Excuse[] {
  let filtered = [...excuses];

  if (options.minAbsurdLevel !== undefined) {
    filtered = filtered.filter((e) => e.absurdLevel >= options.minAbsurdLevel!);
  }

  if (options.maxAbsurdLevel !== undefined) {
    filtered = filtered.filter((e) => e.absurdLevel <= options.maxAbsurdLevel!);
  }

  if (options.minSurrealLevel !== undefined) {
    filtered = filtered.filter(
      (e) => e.surrealLevel >= options.minSurrealLevel!
    );
  }

  if (options.maxSurrealLevel !== undefined) {
    filtered = filtered.filter(
      (e) => e.surrealLevel <= options.maxSurrealLevel!
    );
  }

  return filtered;
}

function getRandomIndices(
  poolSize: number,
  count: number,
  excludeIndices: Set<number>
): number[] {
  const availableIndices = Array.from({ length: poolSize }, (_, i) => i).filter(
    (i) => !excludeIndices.has(i)
  );

  if (availableIndices.length === 0) {
    excuseHistory.clear();
    return Array.from({ length: poolSize }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  if (availableIndices.length < count) {
    const needed = count - availableIndices.length;
    const fromHistory = Array.from(excludeIndices)
      .sort(() => Math.random() - 0.5)
      .slice(0, needed);
    availableIndices.push(...fromHistory);
  }

  return availableIndices.sort(() => Math.random() - 0.5).slice(0, count);
}

export function getRandomExcuses(
  options: ExcuseGeneratorOptions = {}
): Excuse[] {
  const locale = options.locale || "en";
  const count = options.count ?? 2;

  const allExcuses = getExcusesForLocale(locale);
  const filtered = filterExcuses(allExcuses, options);

  if (filtered.length === 0) {
    return [];
  }

  const selectedIndices = getRandomIndices(
    filtered.length,
    count,
    excuseHistory
  );

  const selected = selectedIndices.map((i) => filtered[i]);

  selectedIndices.forEach((i) => {
    if (i !== undefined) {
      excuseHistory.add(i);
      if (excuseHistory.size > HISTORY_SIZE) {
        const firstItem = excuseHistory.values().next().value;
        if (firstItem !== undefined) {
          excuseHistory.delete(firstItem);
        }
      }
    }
  });

  return selected;
}

export function clearExcuseHistory(): void {
  excuseHistory.clear();
}

export function mapEnergyToAbsurdLevel(energy: string): {
  minAbsurdLevel?: number;
  maxAbsurdLevel?: number;
} {
  switch (energy) {
    case "low":
      return { minAbsurdLevel: 1, maxAbsurdLevel: 3 };
    case "medium":
      return { minAbsurdLevel: 3, maxAbsurdLevel: 6 };
    case "high":
      return { minAbsurdLevel: 6, maxAbsurdLevel: 8 };
    case "chaos":
      return { minAbsurdLevel: 8, maxAbsurdLevel: 10 };
    default:
      return {};
  }
}

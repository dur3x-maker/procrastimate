import ruDayStart from "@/data/daystart/ru.json";
import enDayStart from "@/data/daystart/en.json";

interface DayStartText {
  text: string;
}

const HISTORY_SIZE = 3;
const dayStartHistory: Set<number> = new Set();

const dataMap: Record<string, DayStartText[]> = {
  ru: ruDayStart as DayStartText[],
  en: enDayStart as DayStartText[],
};

export function getRandomDayStartText(locale: string = "en"): string {
  const normalizedLocale = locale.toLowerCase().startsWith("ru") ? "ru" : "en";
  const data = dataMap[normalizedLocale] || dataMap.en;

  if (!data || data.length === 0) {
    return normalizedLocale === "ru" ? "Начать работу" : "Start Work";
  }

  const availableIndices = Array.from({ length: data.length }, (_, i) => i).filter(
    (i) => !dayStartHistory.has(i)
  );

  let selectedIndex: number;

  if (availableIndices.length === 0) {
    dayStartHistory.clear();
    selectedIndex = Math.floor(Math.random() * data.length);
  } else {
    selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  dayStartHistory.add(selectedIndex);

  if (dayStartHistory.size > HISTORY_SIZE) {
    const firstItem = Array.from(dayStartHistory)[0];
    if (firstItem !== undefined) {
      dayStartHistory.delete(firstItem);
    }
  }

  return data[selectedIndex].text;
}

export function clearDayStartHistory(): void {
  dayStartHistory.clear();
}

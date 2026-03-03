export interface SharePayload {
  focusMinutes: number;
  breakIgnored: number;
  mode: "idle" | "moderate" | "overheating" | "absurd";
  rarity: "common" | "rare" | "legendary";
  toneMessage: string;
  locale: "ru" | "en";
}

interface LocalizedLabels {
  focus: string;
  breaksIgnored: string;
  mode: string;
}

const LABELS: Record<"ru" | "en", LocalizedLabels> = {
  ru: {
    focus: "Фокус",
    breaksIgnored: "Игнор перерывов",
    mode: "Режим",
  },
  en: {
    focus: "Focus",
    breaksIgnored: "Breaks ignored",
    mode: "Mode",
  },
};

/**
 * Wrap text to fit within a maximum width
 * Returns array of lines
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

/**
 * Generate share image using Canvas API
 * Returns PNG blob
 */
export async function generateShareImage(data: SharePayload): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const WIDTH = 1080;
  const HEIGHT = 1080;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const labels = LABELS[data.locale];

  // Background
  ctx.fillStyle = "#1e1b4b";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ProcrastiMate", WIDTH / 2, 150);

  // Stats block
  ctx.font = "500 36px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#d1d5db";
  ctx.textAlign = "left";

  const statsX = 120;
  let statsY = 300;
  const lineHeight = 60;

  ctx.fillText(`${labels.focus}: ${data.focusMinutes} min`, statsX, statsY);
  statsY += lineHeight;
  ctx.fillText(`${labels.breaksIgnored}: ${data.breakIgnored}`, statsX, statsY);
  statsY += lineHeight;
  ctx.fillText(`${labels.mode}: ${data.mode}`, statsX, statsY);

  // Tone message
  const messageY = 550;
  const messageMaxWidth = WIDTH - 240;

  // Determine color based on rarity and mode
  let messageColor = "#ffffff";
  if (data.rarity === "legendary") {
    messageColor = "#facc15";
  } else if (data.mode === "absurd") {
    messageColor = "#fca5a5";
  }

  ctx.fillStyle = messageColor;
  ctx.font = "600 42px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";

  const messageText = data.rarity === "legendary" 
    ? `👑 ${data.toneMessage}` 
    : data.toneMessage;

  const wrappedLines = wrapText(ctx, messageText, messageMaxWidth);

  wrappedLines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, messageY + index * 55);
  });

  // Watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "400 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("procrastimate.app", WIDTH / 2, HEIGHT - 80);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to generate image blob"));
      }
    }, "image/png");
  });
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `procrastimate-${year}-${month}-${day}-${hours}${minutes}.png`;
}

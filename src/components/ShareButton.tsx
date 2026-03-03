"use client";

import { useState } from "react";
import { generateShareImage, generateFilename, type SharePayload } from "@/utils/shareGenerator";

interface ShareButtonProps {
  payload: SharePayload;
  label: string;
  isLegendary?: boolean;
}

export function ShareButton({ payload, label, isLegendary = false }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!payload.toneMessage) {
      console.error("Cannot share: tone message is empty");
      return;
    }

    try {
      setIsSharing(true);

      const blob = await generateShareImage(payload);
      const filename = generateFilename();
      const file = new File([blob], filename, { type: "image/png" });

      // Try Web Share API first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "ProcrastiMate",
          text: payload.toneMessage,
        });
      } else {
        // Fallback: download file
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing || !payload.toneMessage}
      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
        isLegendary
          ? "bg-gradient-to-r from-purple-start to-purple-end text-white hover:opacity-90 shadow-lg"
          : "border-2 border-border text-foreground hover:bg-border/50"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isSharing ? "..." : label}
    </button>
  );
}

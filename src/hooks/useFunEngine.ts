"use client";

import { useState } from "react";
import type { EnergyLevel } from "@/lib/energy";

interface FunContent {
  type: string;
  category: string;
  url: string;
  duration_seconds: number;
}

interface UseFunEngineReturn {
  content: FunContent | null;
  loading: boolean;
  error: string | null;
  loadContent: (energy: EnergyLevel) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useFunEngine(): UseFunEngineReturn {
  const [content, setContent] = useState<FunContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContent = async (energy: EnergyLevel) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/fun/random?energy=${energy}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.status}`);
      }

      const data = await response.json();
      setContent(data);
    } catch (err) {
      console.error("[useFunEngine] Failed to load content:", err);
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    loading,
    error,
    loadContent,
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SessionStats {
  total_focus_minutes: number;
  total_break_minutes: number;
  total_sessions: number;
  total_completed_tasks: number;
  streak: number;
}

export interface DailySessionPayload {
  focus_minutes: number;
  break_minutes: number;
  session_count: number;
  completed_tasks: number;
}

export async function saveDailySession(
  userId: string,
  payload: DailySessionPayload
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/sessions/daily/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to save session: ${response.status}`);
    }
  } catch (error) {
    console.error("[Session API] Failed to save daily session:", error);
    throw error;
  }
}

export async function fetchStats(
  userId: string,
  range: "weekly" | "monthly"
): Promise<SessionStats> {
  try {
    const response = await fetch(
      `${API_URL}/sessions/history/${userId}?range=${range}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("[Session API] Failed to fetch stats:", error);
    throw error;
  }
}

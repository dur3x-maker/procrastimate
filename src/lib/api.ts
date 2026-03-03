const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[API] Using API URL:", API_URL);
}

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  updated_at: string;
}

export interface AchievementUpdateResponse {
  unlocked_now: boolean;
  achievement_id: string | null;
}

export interface StreakUpdateResponse {
  unlocked_achievements: AchievementUpdateResponse[];
}

export interface BehaviorTrackResponse {
  unlocked_achievements: AchievementUpdateResponse[];
}

export interface AchievementEventResponse {
  unlocked_achievements: AchievementUpdateResponse[];
}

export interface DailySession {
  id: string;
  user_id: string;
  date: string;
  focus_minutes: number;
  break_minutes: number;
  rest_minutes: number;
  session_count: number;
  completed_tasks: number;
}

export interface AggregatedStats {
  total_focus_minutes: number;
  total_break_minutes: number;
  total_rest_minutes: number;
  total_sessions: number;
  total_completed_tasks: number;
  streak: number;
}

export interface FunContent {
  type: "video" | "meme" | "absurd";
  title: string;
  url?: string;
  id?: string;
  category?: string;
  estimated_read_time_sec?: number;
  duration_seconds?: number;
  body?: string;
  learn_more_url?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[API] Request failed for ${url}:`, error);
      }
      throw error;
    }
  }

  async getAchievements(userId: string): Promise<AchievementProgress[]> {
    return this.request<AchievementProgress[]>(`/achievements/${userId}`);
  }

  async updateAchievement(
    userId: string,
    achievementId: string,
    value: number
  ): Promise<AchievementUpdateResponse> {
    return this.request<AchievementUpdateResponse>(
      `/achievements/update/${userId}`,
      {
        method: "POST",
        body: JSON.stringify({ achievement_id: achievementId, value }),
      }
    );
  }

  async updateStreak(userId: string): Promise<StreakUpdateResponse> {
    return this.request<StreakUpdateResponse>(`/streak/update/${userId}`, {
      method: "POST",
    });
  }

  async trackGhost(
    userId: string,
    didUserPerformAction: boolean
  ): Promise<BehaviorTrackResponse> {
    return this.request<BehaviorTrackResponse>(`/behavior/ghost/${userId}`, {
      method: "POST",
      body: JSON.stringify({ did_user_perform_action: didUserPerformAction }),
    });
  }

  async getFunContent(energyLevel?: string): Promise<FunContent> {
    const params = new URLSearchParams();
    if (energyLevel) {
      params.append('energy', energyLevel);
    } else {
      params.append('type', 'meme');
    }
    return this.request<FunContent>(`/fun/random?${params.toString()}`);
  }

  async getRandomLongread(energyLevel?: string): Promise<FunContent> {
    const params = new URLSearchParams();
    if (energyLevel) {
      params.append('energy', energyLevel);
    }
    return this.request<FunContent>(`/fun/longread/random?${params.toString()}`);
  }

  async getRandomVideo(energyLevel?: string): Promise<FunContent> {
    const params = new URLSearchParams();
    if (energyLevel) {
      params.append('energy', energyLevel);
    }
    return this.request<FunContent>(`/fun/video/random?${params.toString()}`);
  }

  async addRestTime(userId: string, restSeconds: number): Promise<void> {
    return this.request<void>(`/sessions/rest/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ rest_seconds: restSeconds }),
    });
  }

  async triggerAchievementEvent(
    userId: string,
    event: string,
    metadata?: Record<string, any>
  ): Promise<AchievementEventResponse> {
    return this.request<AchievementEventResponse>(
      `/achievements/trigger-event/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify({ event, metadata }),
      }
    );
  }

  async triggerTaskCompleted(
    userId: string,
    taskId: string,
    sessionId?: string
  ): Promise<AchievementEventResponse> {
    return this.triggerAchievementEvent(userId, 'task_completed', {
      task_id: taskId,
      session_id: sessionId,
    });
  }

  async getDailySession(userId: string): Promise<DailySession | null> {
    try {
      return await this.request<DailySession>(`/sessions/daily/${userId}`);
    } catch (error) {
      return null;
    }
  }

  async getAggregatedStats(userId: string, range: 'weekly' | 'monthly' = 'weekly'): Promise<AggregatedStats> {
    return this.request<AggregatedStats>(`/sessions/history/${userId}?range=${range}`);
  }
}

export const api = new ApiClient(API_URL);

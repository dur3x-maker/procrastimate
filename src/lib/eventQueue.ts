"use client";

import { api } from "@/lib/api";

const QUEUE_KEY = "pm_event_queue";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 8000];

export interface QueuedEvent {
  id: string;
  userId: string;
  event: string;
  metadata?: Record<string, any>;
  retries: number;
  createdAt: number;
}

function loadQueue(): QueuedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function removeFromQueue(id: string) {
  const queue = loadQueue().filter((e) => e.id !== id);
  saveQueue(queue);
}

function addToQueue(event: QueuedEvent) {
  const queue = loadQueue();
  // Deduplicate by id
  if (queue.some((e) => e.id === event.id)) return;
  queue.push(event);
  saveQueue(queue);
}

async function attemptSend(
  userId: string,
  event: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    await api.triggerAchievementEvent(userId, event, metadata);
    return true;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send an event with up to MAX_RETRIES attempts.
 * If all retries fail, queues the event in localStorage for resend on next load.
 */
export async function sendEventWithRetry(
  userId: string,
  event: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const eventId = metadata?.idempotency_key || `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const ok = await attemptSend(userId, event, metadata);
    if (ok) return true;

    if (attempt < MAX_RETRIES - 1) {
      await delay(RETRY_DELAYS[attempt]);
    }
  }

  // All retries failed — queue for later
  console.warn(`[eventQueue] All retries failed for ${event}, queuing`);
  addToQueue({
    id: eventId,
    userId,
    event,
    metadata,
    retries: 0,
    createdAt: Date.now(),
  });
  return false;
}

/**
 * Flush any queued events from localStorage (call on page load).
 * Removes events older than 24 hours.
 */
export async function flushEventQueue(userId: string): Promise<void> {
  const queue = loadQueue();
  if (queue.length === 0) return;

  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000;
  const valid = queue.filter((e) => now - e.createdAt < MAX_AGE && e.userId === userId);

  // Remove stale
  if (valid.length !== queue.length) {
    saveQueue(valid);
  }

  for (const entry of valid) {
    const ok = await attemptSend(entry.userId, entry.event, entry.metadata);
    if (ok) {
      removeFromQueue(entry.id);
      console.log(`[eventQueue] Flushed queued event: ${entry.event}`);
    } else {
      entry.retries += 1;
      if (entry.retries >= MAX_RETRIES) {
        removeFromQueue(entry.id);
        console.error(`[eventQueue] Permanently failed: ${entry.event} (${entry.id})`);
      }
    }
  }
}

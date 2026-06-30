/**
 * Offline queue logic: add, get, remove, count, and capacity enforcement.
 * Max capacity: 100 entries.
 */

import {
  addEntry,
  getAllEntries,
  removeEntry,
  getEntryCount,
  clearAll,
  type QueueEntry,
} from "./indexed-db";

export const MAX_QUEUE_SIZE = 100;

export interface QueueResult {
  success: boolean;
  atCapacity: boolean;
  count: number;
}

/**
 * Enqueue a new entry to the offline queue.
 * Returns success=false and atCapacity=true if queue is full.
 */
export async function enqueue(
  entry: Omit<QueueEntry, "id" | "timestamp">
): Promise<QueueResult> {
  const count = await getEntryCount();

  if (count >= MAX_QUEUE_SIZE) {
    return { success: false, atCapacity: true, count };
  }

  const queueEntry: QueueEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };

  await addEntry(queueEntry);
  const newCount = count + 1;

  return {
    success: true,
    atCapacity: newCount >= MAX_QUEUE_SIZE,
    count: newCount,
  };
}

/**
 * Get all queued entries in submission order (by timestamp ascending).
 */
export async function getQueuedEntries(): Promise<QueueEntry[]> {
  return getAllEntries();
}

/**
 * Remove a single entry from the queue by ID.
 */
export async function dequeue(id: string): Promise<void> {
  return removeEntry(id);
}

/**
 * Get current queue count.
 */
export async function getCount(): Promise<number> {
  return getEntryCount();
}

/**
 * Check if the queue is at capacity.
 */
export async function isAtCapacity(): Promise<boolean> {
  const count = await getEntryCount();
  return count >= MAX_QUEUE_SIZE;
}

/**
 * Clear the entire queue.
 */
export async function clearQueue(): Promise<void> {
  return clearAll();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

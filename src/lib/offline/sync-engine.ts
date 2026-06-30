/**
 * Sync engine: processes offline queue entries when connectivity is restored.
 *
 * Behavior:
 * - Iterates queued entries in timestamp (submission) order
 * - On success (2xx): removes entry from queue
 * - On conflict (409): preserves entry, marks conflicted, notifies caller
 * - On other errors (5xx, network): stops syncing, defers to next online event
 */

import { apiClient, ApiClientError } from "@/lib/api/client";
import { getQueuedEntries, dequeue } from "./offline-queue";
import type { QueueEntry } from "./indexed-db";

export interface SyncConflict {
  id: string;
  entryType: string;
  path: string;
  timestamp: number;
  message: string;
}

export interface SyncResult {
  synced: number;
  conflicts: SyncConflict[];
  stoppedOnError: boolean;
  remaining: number;
}

/**
 * Attempt to sync all queued entries in submission order.
 * Calls onProgress after each successfully synced or conflicted entry.
 */
export async function syncQueuedEntries(
  onProgress?: (synced: number, remaining: number) => void
): Promise<SyncResult> {
  const entries = await getQueuedEntries();
  let synced = 0;
  const conflicts: SyncConflict[] = [];
  let stoppedOnError = false;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      await sendEntry(entry);
      // Success - remove from queue
      await dequeue(entry.id);
      synced++;
      onProgress?.(synced, entries.length - synced - conflicts.length);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        // Conflict - preserve entry, notify caller
        conflicts.push({
          id: entry.id,
          entryType: entry.entryType,
          path: entry.path,
          timestamp: entry.timestamp,
          message: `Sync conflict for ${entry.entryType} entry. The server version differs from your local version.`,
        });
        // Remove from queue since it's now tracked as a conflict
        await dequeue(entry.id);
        onProgress?.(synced, entries.length - synced - conflicts.length - i - 1 + i);
      } else {
        // Hard error (5xx, network) - stop syncing
        stoppedOnError = true;
        break;
      }
    }
  }

  const remaining = entries.length - synced - conflicts.length - (stoppedOnError ? 0 : 0);
  const actualRemaining = stoppedOnError
    ? entries.length - synced - conflicts.length
    : 0;

  return {
    synced,
    conflicts,
    stoppedOnError,
    remaining: actualRemaining,
  };
}

/**
 * Send a single queued entry to the API based on its method.
 */
async function sendEntry(entry: QueueEntry): Promise<void> {
  switch (entry.method) {
    case "POST":
      await apiClient.post(entry.path, entry.body);
      break;
    case "PUT":
      await apiClient.put(entry.path, entry.body);
      break;
    case "DELETE":
      await apiClient.delete(entry.path);
      break;
  }
}

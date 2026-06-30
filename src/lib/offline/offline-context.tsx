"use client";

/**
 * React context and provider for offline state management.
 * Tracks online/offline status, pending entry count, capacity warnings,
 * sync conflicts, and automatic sync triggering on connectivity restore.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  enqueue,
  getCount,
  MAX_QUEUE_SIZE,
  type QueueResult,
} from "./offline-queue";
import { syncQueuedEntries, type SyncConflict } from "./sync-engine";
import type { QueueEntry } from "./indexed-db";

export interface OfflineState {
  /** Whether the browser currently has connectivity */
  isOnline: boolean;
  /** Number of entries pending sync */
  pendingCount: number;
  /** Whether the queue has reached capacity (100 entries) */
  isAtCapacity: boolean;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Active sync conflicts the user needs to be notified about */
  conflicts: SyncConflict[];
  /** Add an entry to the offline queue */
  queueEntry: (entry: Omit<QueueEntry, "id" | "timestamp">) => Promise<QueueResult>;
  /** Refresh the pending count from IndexedDB */
  refreshCount: () => Promise<void>;
  /** Dismiss a conflict notification by ID */
  dismissConflict: (id: string) => void;
}

const OfflineContext = createContext<OfflineState | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isAtCapacity, setIsAtCapacity] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  // Track previous online state to detect false→true transitions
  const prevOnlineRef = useRef(isOnline);
  // Prevent concurrent syncs
  const syncingRef = useRef(false);

  /**
   * Perform sync of queued entries. Runs in background, does not block UI.
   */
  const performSync = useCallback(async () => {
    if (syncingRef.current) return;

    // Check if there are entries to sync
    const count = await getCount();
    if (count === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const result = await syncQueuedEntries((synced, remaining) => {
        // Update pending count as entries sync
        setPendingCount(remaining);
      });

      // Add any new conflicts
      if (result.conflicts.length > 0) {
        setConflicts((prev) => [...prev, ...result.conflicts]);
      }

      // Refresh the accurate count from IndexedDB
      const finalCount = await getCount();
      setPendingCount(finalCount);
      setIsAtCapacity(finalCount >= MAX_QUEUE_SIZE);
    } catch {
      // Unexpected error during sync - silently fail, will retry on next online event
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Trigger sync when connectivity transitions from offline→online
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline) {
      // Connectivity restored - sync queued entries
      performSync();
    }
  }, [isOnline, performSync]);

  // Also attempt sync on mount if online and there are pending entries
  useEffect(() => {
    if (isOnline) {
      performSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load initial count on mount
  useEffect(() => {
    refreshCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getCount();
      setPendingCount(count);
      setIsAtCapacity(count >= MAX_QUEUE_SIZE);
    } catch {
      // IndexedDB may not be available in some environments
    }
  }, []);

  const queueEntry = useCallback(
    async (entry: Omit<QueueEntry, "id" | "timestamp">): Promise<QueueResult> => {
      const result = await enqueue(entry);
      setPendingCount(result.count);
      setIsAtCapacity(result.atCapacity);
      return result;
    },
    []
  );

  const dismissConflict = useCallback((id: string) => {
    setConflicts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isAtCapacity,
        isSyncing,
        conflicts,
        queueEntry,
        refreshCount,
        dismissConflict,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline state.
 * Must be used within an OfflineProvider.
 */
export function useOffline(): OfflineState {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}

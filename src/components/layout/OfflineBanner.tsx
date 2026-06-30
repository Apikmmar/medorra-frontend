"use client";

/**
 * Visible indicator for pending unsynced entries, offline status, and sync conflicts.
 * Shows:
 * - Yellow banner when offline with pending count
 * - Red warning when queue is at capacity
 * - Blue banner when online and syncing
 * - Orange banner for sync conflicts
 */

import { useOffline } from "@/lib/offline";

export function OfflineBanner() {
  const { isOnline, pendingCount, isAtCapacity, isSyncing, conflicts, dismissConflict } =
    useOffline();

  return (
    <>
      {/* Conflict notifications */}
      {conflicts.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col gap-1 bg-orange-50 border-b border-orange-200 px-4 py-2 text-sm text-orange-800"
        >
          <div className="flex items-center gap-2">
            <ConflictIcon className="h-4 w-4 flex-shrink-0 text-orange-500" />
            <span>
              {conflicts.length} sync{" "}
              {conflicts.length === 1 ? "conflict" : "conflicts"} detected.
              Your local entries have been preserved.
            </span>
          </div>
          <ul className="ml-6 list-disc space-y-1">
            {conflicts.map((conflict) => (
              <li key={conflict.id} className="flex items-center gap-2">
                <span className="flex-1">{conflict.message}</span>
                <button
                  type="button"
                  onClick={() => dismissConflict(conflict.id)}
                  className="text-orange-600 hover:text-orange-800 underline text-xs"
                  aria-label={`Dismiss conflict for ${conflict.entryType} entry`}
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status banners */}
      <StatusBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isAtCapacity={isAtCapacity}
        isSyncing={isSyncing}
      />
    </>
  );
}

function StatusBanner({
  isOnline,
  pendingCount,
  isAtCapacity,
  isSyncing,
}: {
  isOnline: boolean;
  pendingCount: number;
  isAtCapacity: boolean;
  isSyncing: boolean;
}) {
  // Nothing to show if online, no pending entries, and not syncing
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  // Capacity warning (red)
  if (isAtCapacity) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800"
      >
        <WarningIcon className="h-4 w-4 flex-shrink-0 text-red-500" />
        <span>
          Queue full ({pendingCount} entries). New entries cannot be saved until
          connectivity is restored and pending entries sync.
        </span>
      </div>
    );
  }

  // Offline with pending entries (yellow)
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800"
      >
        <OfflineIcon className="h-4 w-4 flex-shrink-0 text-amber-500" />
        <span>
          You&apos;re offline.{" "}
          {pendingCount > 0
            ? `${pendingCount} ${pendingCount === 1 ? "entry" : "entries"} pending sync.`
            : "Entries will be saved locally."}
        </span>
      </div>
    );
  }

  // Online but still has pending entries or syncing (blue)
  if (pendingCount > 0 || isSyncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800"
      >
        <SyncIcon className="h-4 w-4 flex-shrink-0 text-blue-500 animate-spin" />
        <span>
          Syncing {pendingCount} {pendingCount === 1 ? "entry" : "entries"}...
        </span>
      </div>
    );
  }

  return null;
}

function ConflictIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function OfflineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-2.38.75.75 0 00-1.08-1.04 8.528 8.528 0 01-2.9 2.058L12.22 10.48A5.478 5.478 0 0114 9.5a.75.75 0 00-.46-1.39 3.978 3.978 0 00-2.394 1.327L3.28 2.22zM6 9.5a.75.75 0 00.46 1.39 3.97 3.97 0 001.893-.516L6.78 8.8A5.5 5.5 0 006 9.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SyncIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.06-.179zm-11.623-2.848a5.5 5.5 0 019.201-2.466l.312.311H10.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.537a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 001.63 8.397a.75.75 0 001.06.179z"
        clipRule="evenodd"
      />
    </svg>
  );
}

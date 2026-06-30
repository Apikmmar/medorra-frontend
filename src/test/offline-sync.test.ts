/**
 * Tests for offline sync engine (task 15.2).
 *
 * Validates:
 * - Entries are synced in submission order when connectivity restores
 * - Successful syncs remove entries from the queue
 * - Conflict handling: entry preserved (as conflict), user notified
 * - 5xx errors stop the sync process
 * - Property: for any sequence of entries with mixed outcomes, queue state is consistent
 *
 * **Validates: Requirements 11.5, 11.6**
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import {
  syncQueuedEntries,
  type SyncConflict,
  type SyncResult,
} from "@/lib/offline/sync-engine";
import type { QueueEntry } from "@/lib/offline/indexed-db";

// Mock dependencies
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string;
    status: number;
    field?: string;
    constructor(message: string, code: string, status: number, field?: string) {
      super(message);
      this.name = "ApiClientError";
      this.code = code;
      this.status = status;
      this.field = field;
    }
  },
}));

vi.mock("@/lib/offline/offline-queue", () => ({
  getQueuedEntries: vi.fn(),
  dequeue: vi.fn(),
}));

// Import mocked modules
import { apiClient, ApiClientError } from "@/lib/api/client";
import { getQueuedEntries, dequeue } from "@/lib/offline/offline-queue";

const mockGetQueuedEntries = vi.mocked(getQueuedEntries);
const mockDequeue = vi.mocked(dequeue);
const mockApiPost = vi.mocked(apiClient.post);
const mockApiPut = vi.mocked(apiClient.put);
const mockApiDelete = vi.mocked(apiClient.delete);

function createEntry(
  id: string,
  timestamp: number,
  method: "POST" | "PUT" | "DELETE" = "POST",
  entryType = "symptom"
): QueueEntry {
  return {
    id,
    method,
    path: `/entries/${entryType}`,
    body: { name: `test-${id}` },
    timestamp,
    entryType,
  };
}

describe("syncQueuedEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDequeue.mockResolvedValue(undefined);
  });

  it("syncs entries in timestamp (submission) order", async () => {
    const entries = [
      createEntry("a", 1000),
      createEntry("b", 2000),
      createEntry("c", 3000),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);
    mockApiPost.mockResolvedValue({ data: {}, status: 201, ok: true });

    const callOrder: string[] = [];
    mockApiPost.mockImplementation(async (path, body) => {
      callOrder.push((body as any).name);
      return { data: {}, status: 201, ok: true };
    });

    await syncQueuedEntries();

    expect(callOrder).toEqual(["test-a", "test-b", "test-c"]);
  });

  it("removes entries from queue after successful sync", async () => {
    const entries = [
      createEntry("a", 1000),
      createEntry("b", 2000),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);
    mockApiPost.mockResolvedValue({ data: {}, status: 201, ok: true });

    const result = await syncQueuedEntries();

    expect(result.synced).toBe(2);
    expect(mockDequeue).toHaveBeenCalledWith("a");
    expect(mockDequeue).toHaveBeenCalledWith("b");
    expect(mockDequeue).toHaveBeenCalledTimes(2);
  });

  it("handles conflict (409): preserves entry info as conflict, notifies via result", async () => {
    const entries = [
      createEntry("a", 1000),
      createEntry("b", 2000),
      createEntry("c", 3000),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);

    // First succeeds, second conflicts, third succeeds
    mockApiPost
      .mockResolvedValueOnce({ data: {}, status: 201, ok: true })
      .mockRejectedValueOnce(
        new (ApiClientError as any)("Conflict", "CONFLICT", 409)
      )
      .mockResolvedValueOnce({ data: {}, status: 201, ok: true });

    const result = await syncQueuedEntries();

    expect(result.synced).toBe(2);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].id).toBe("b");
    expect(result.conflicts[0].entryType).toBe("symptom");
    expect(result.stoppedOnError).toBe(false);
    // Conflicted entry is dequeued (tracked as conflict externally)
    expect(mockDequeue).toHaveBeenCalledWith("b");
  });

  it("stops syncing on 5xx server errors", async () => {
    const entries = [
      createEntry("a", 1000),
      createEntry("b", 2000),
      createEntry("c", 3000),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);

    mockApiPost
      .mockResolvedValueOnce({ data: {}, status: 201, ok: true })
      .mockRejectedValueOnce(
        new (ApiClientError as any)("Server Error", "SERVER_ERROR", 500)
      );

    const result = await syncQueuedEntries();

    expect(result.synced).toBe(1);
    expect(result.stoppedOnError).toBe(true);
    expect(result.remaining).toBe(2); // b and c remain
    // Only "a" was dequeued
    expect(mockDequeue).toHaveBeenCalledTimes(1);
    expect(mockDequeue).toHaveBeenCalledWith("a");
    // "c" was never attempted
    expect(mockApiPost).toHaveBeenCalledTimes(2);
  });

  it("stops syncing on network errors", async () => {
    const entries = [
      createEntry("a", 1000),
      createEntry("b", 2000),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);

    mockApiPost.mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await syncQueuedEntries();

    expect(result.synced).toBe(0);
    expect(result.stoppedOnError).toBe(true);
    expect(result.remaining).toBe(2);
    expect(mockDequeue).not.toHaveBeenCalled();
  });

  it("handles PUT and DELETE methods correctly", async () => {
    const entries = [
      createEntry("a", 1000, "PUT", "medication"),
      createEntry("b", 2000, "DELETE", "food"),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);
    mockApiPut.mockResolvedValue({ data: {}, status: 200, ok: true });
    mockApiDelete.mockResolvedValue({ data: {}, status: 200, ok: true });

    const result = await syncQueuedEntries();

    expect(result.synced).toBe(2);
    expect(mockApiPut).toHaveBeenCalledWith("/entries/medication", { name: "test-a" });
    expect(mockApiDelete).toHaveBeenCalledWith("/entries/food");
  });

  it("returns empty result when queue is empty", async () => {
    mockGetQueuedEntries.mockResolvedValue([]);

    const result = await syncQueuedEntries();

    expect(result.synced).toBe(0);
    expect(result.conflicts).toHaveLength(0);
    expect(result.stoppedOnError).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("calls onProgress callback as entries sync", async () => {
    const entries = [
      createEntry("a", 1000),
      createEntry("b", 2000),
      createEntry("c", 3000),
    ];
    mockGetQueuedEntries.mockResolvedValue(entries);
    mockApiPost.mockResolvedValue({ data: {}, status: 201, ok: true });

    const onProgress = vi.fn();
    await syncQueuedEntries(onProgress);

    expect(onProgress).toHaveBeenCalled();
    // First call: synced=1
    expect(onProgress.mock.calls[0][0]).toBe(1);
  });
});

describe("syncQueuedEntries - property-based tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDequeue.mockResolvedValue(undefined);
  });

  /**
   * **Validates: Requirements 11.5, 11.6**
   *
   * Property: For any sequence of entries with mixed success/conflict/failure outcomes,
   * the queue state is consistent:
   * - Successes are counted and dequeued
   * - Conflicts are tracked and dequeued from queue (moved to conflict list)
   * - Everything after first hard failure is preserved (not attempted)
   */
  it("maintains consistent queue state for any sequence of outcomes", async () => {
    // Outcome types: 'success' | 'conflict' | 'failure'
    const outcomeArb = fc.constantFrom("success", "conflict", "failure");
    const entryCountArb = fc.integer({ min: 0, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        entryCountArb,
        fc.array(outcomeArb, { minLength: 0, maxLength: 20 }),
        async (entryCount, outcomes) => {
          vi.clearAllMocks();
          mockDequeue.mockResolvedValue(undefined);

          // Generate entries
          const count = Math.min(entryCount, outcomes.length);
          const entries: QueueEntry[] = Array.from({ length: count }, (_, i) =>
            createEntry(`entry-${i}`, 1000 + i * 100)
          );
          mockGetQueuedEntries.mockResolvedValue(entries);

          // Setup API responses based on outcomes
          let callIndex = 0;
          mockApiPost.mockImplementation(async () => {
            const outcome = outcomes[callIndex];
            callIndex++;
            if (outcome === "conflict") {
              throw new (ApiClientError as any)("Conflict", "CONFLICT", 409);
            }
            if (outcome === "failure") {
              throw new (ApiClientError as any)("Error", "SERVER_ERROR", 500);
            }
            return { data: {}, status: 201, ok: true };
          });

          const result = await syncQueuedEntries();

          // Find first hard failure index
          const firstFailureIdx = outcomes.slice(0, count).findIndex((o) => o === "failure");
          const processedCount =
            firstFailureIdx === -1 ? count : firstFailureIdx;

          // Count successes and conflicts in processed range
          const expectedSynced = outcomes
            .slice(0, processedCount)
            .filter((o) => o === "success").length;
          const expectedConflicts = outcomes
            .slice(0, processedCount)
            .filter((o) => o === "conflict").length;

          // Verify invariants
          expect(result.synced).toBe(expectedSynced);
          expect(result.conflicts).toHaveLength(expectedConflicts);

          if (firstFailureIdx !== -1 && firstFailureIdx < count) {
            expect(result.stoppedOnError).toBe(true);
            // remaining = total - synced - conflicts (entries after failure + the failure itself)
            expect(result.remaining).toBe(count - expectedSynced - expectedConflicts);
          } else {
            expect(result.stoppedOnError).toBe(false);
            expect(result.remaining).toBe(0);
          }

          // dequeue called for all successes + conflicts
          expect(mockDequeue).toHaveBeenCalledTimes(
            expectedSynced + expectedConflicts
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

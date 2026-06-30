/**
 * Tests for the offline queue module.
 * Includes unit tests and property-based tests with fast-check.
 *
 * **Validates: Requirements 11.5**
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  enqueue,
  getQueuedEntries,
  dequeue,
  getCount,
  isAtCapacity,
  clearQueue,
  MAX_QUEUE_SIZE,
} from "@/lib/offline/offline-queue";
import {
  addEntry,
  getAllEntries,
  getEntryCount,
  removeEntry,
  clearAll,
  type QueueEntry,
} from "@/lib/offline/indexed-db";

// --- In-memory IndexedDB mock ---
// We mock IndexedDB at the module level for a reliable test environment.

let store: Map<string, QueueEntry>;

// Mock the indexed-db module
vi.mock("@/lib/offline/indexed-db", () => {
  return {
    addEntry: async (entry: QueueEntry) => {
      store.set(entry.id, entry);
    },
    getAllEntries: async (): Promise<QueueEntry[]> => {
      return Array.from(store.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
    },
    getEntryCount: async (): Promise<number> => {
      return store.size;
    },
    removeEntry: async (id: string) => {
      store.delete(id);
    },
    clearAll: async () => {
      store.clear();
    },
  };
});

beforeEach(() => {
  store = new Map();
});

// --- Unit Tests ---

describe("Offline Queue - Unit Tests", () => {
  it("should enqueue an entry successfully", async () => {
    const result = await enqueue({
      method: "POST",
      path: "/entries/symptoms",
      body: { name: "headache", severity: 5 },
      entryType: "symptom",
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.atCapacity).toBe(false);
  });

  it("should return entries in submission order", async () => {
    await enqueue({ method: "POST", path: "/a", entryType: "symptom" });
    await enqueue({ method: "POST", path: "/b", entryType: "medication" });
    await enqueue({ method: "POST", path: "/c", entryType: "food" });

    const entries = await getQueuedEntries();
    expect(entries).toHaveLength(3);
    expect(entries[0].path).toBe("/a");
    expect(entries[1].path).toBe("/b");
    expect(entries[2].path).toBe("/c");
  });

  it("should reject entries when queue is at capacity", async () => {
    // Fill the queue
    for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
      await enqueue({ method: "POST", path: `/entry-${i}`, entryType: "symptom" });
    }

    // Try to add one more
    const result = await enqueue({
      method: "POST",
      path: "/overflow",
      entryType: "symptom",
    });

    expect(result.success).toBe(false);
    expect(result.atCapacity).toBe(true);
    expect(result.count).toBe(MAX_QUEUE_SIZE);
  });

  it("should correctly report capacity at exactly 100", async () => {
    for (let i = 0; i < 99; i++) {
      await enqueue({ method: "POST", path: `/entry-${i}`, entryType: "symptom" });
    }

    const result = await enqueue({
      method: "POST",
      path: "/entry-99",
      entryType: "symptom",
    });

    expect(result.success).toBe(true);
    expect(result.atCapacity).toBe(true);
    expect(result.count).toBe(100);
  });

  it("should remove entries with dequeue", async () => {
    await enqueue({ method: "POST", path: "/a", entryType: "symptom" });
    const entries = await getQueuedEntries();
    expect(entries).toHaveLength(1);

    await dequeue(entries[0].id);
    const remaining = await getQueuedEntries();
    expect(remaining).toHaveLength(0);
  });

  it("should return correct count", async () => {
    expect(await getCount()).toBe(0);
    await enqueue({ method: "POST", path: "/a", entryType: "symptom" });
    expect(await getCount()).toBe(1);
    await enqueue({ method: "POST", path: "/b", entryType: "food" });
    expect(await getCount()).toBe(2);
  });

  it("should clear all entries", async () => {
    await enqueue({ method: "POST", path: "/a", entryType: "symptom" });
    await enqueue({ method: "POST", path: "/b", entryType: "food" });
    await clearQueue();
    expect(await getCount()).toBe(0);
  });

  it("should report isAtCapacity correctly", async () => {
    expect(await isAtCapacity()).toBe(false);
    for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
      await enqueue({ method: "POST", path: `/entry-${i}`, entryType: "symptom" });
    }
    expect(await isAtCapacity()).toBe(true);
  });

  it("should preserve entry metadata", async () => {
    const body = { name: "migraine", severity: 8, notes: "after lunch" };
    await enqueue({
      method: "POST",
      path: "/entries/symptoms",
      body,
      entryType: "symptom",
    });

    const entries = await getQueuedEntries();
    expect(entries[0].method).toBe("POST");
    expect(entries[0].path).toBe("/entries/symptoms");
    expect(entries[0].body).toEqual(body);
    expect(entries[0].entryType).toBe("symptom");
    expect(entries[0].id).toBeDefined();
    expect(entries[0].timestamp).toBeGreaterThan(0);
  });
});

// --- Property-Based Tests ---

/** Arbitrary for entry types */
const entryTypeArb = fc.constantFrom("symptom", "medication", "food", "sleep");

/** Arbitrary for HTTP methods */
const methodArb = fc.constantFrom("POST" as const, "PUT" as const, "DELETE" as const);

/** Arbitrary for a queue entry (without id/timestamp, as those are generated) */
const queueEntryInputArb = fc.record({
  method: methodArb,
  path: fc.string({ minLength: 1, maxLength: 100 }).map((s) => `/${s}`),
  entryType: entryTypeArb,
  body: fc.option(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      value: fc.integer({ min: 1, max: 10 }),
    }),
    { nil: undefined }
  ),
});

describe("Offline Queue - Property-Based Tests (Property 24)", () => {
  /**
   * **Validates: Requirements 11.5**
   *
   * Property 24: For any sequence of entries submitted while offline (up to 100),
   * all entries SHALL be preserved in the local queue and SHALL be successfully
   * synced to the server when connectivity is restored, in submission order.
   */

  it("all entries up to capacity are preserved in submission order", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(queueEntryInputArb, { minLength: 1, maxLength: MAX_QUEUE_SIZE }),
        async (entries) => {
          // Clear state
          await clearQueue();

          // Enqueue all entries
          for (const entry of entries) {
            await enqueue(entry);
          }

          // All should be preserved
          const queued = await getQueuedEntries();
          expect(queued).toHaveLength(entries.length);

          // Verify submission order (by index matching)
          for (let i = 0; i < entries.length; i++) {
            expect(queued[i].method).toBe(entries[i].method);
            expect(queued[i].path).toBe(entries[i].path);
            expect(queued[i].entryType).toBe(entries[i].entryType);
          }

          // Verify timestamps are non-decreasing (submission order)
          for (let i = 1; i < queued.length; i++) {
            expect(queued[i].timestamp).toBeGreaterThanOrEqual(
              queued[i - 1].timestamp
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it("queue never exceeds MAX_QUEUE_SIZE entries", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(queueEntryInputArb, { minLength: 1, maxLength: 150 }),
        async (entries) => {
          await clearQueue();

          for (const entry of entries) {
            await enqueue(entry);
          }

          const count = await getCount();
          expect(count).toBeLessThanOrEqual(MAX_QUEUE_SIZE);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("entries beyond capacity are rejected without corrupting existing queue", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(queueEntryInputArb, {
          minLength: MAX_QUEUE_SIZE + 1,
          maxLength: MAX_QUEUE_SIZE + 20,
        }),
        async (entries) => {
          await clearQueue();

          const results = [];
          for (const entry of entries) {
            results.push(await enqueue(entry));
          }

          // First 100 should succeed
          for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
            expect(results[i].success).toBe(true);
          }

          // Remaining should be rejected
          for (let i = MAX_QUEUE_SIZE; i < results.length; i++) {
            expect(results[i].success).toBe(false);
            expect(results[i].atCapacity).toBe(true);
          }

          // Queue should contain exactly the first 100 entries
          const queued = await getQueuedEntries();
          expect(queued).toHaveLength(MAX_QUEUE_SIZE);

          // Verify the first 100 entries are preserved correctly
          for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
            expect(queued[i].method).toBe(entries[i].method);
            expect(queued[i].path).toBe(entries[i].path);
            expect(queued[i].entryType).toBe(entries[i].entryType);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it("dequeuing entries preserves order of remaining entries", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(queueEntryInputArb, { minLength: 3, maxLength: 20 }),
        fc.integer({ min: 0, max: 19 }).chain((n) =>
          fc.constant(n)
        ),
        async (entries, removeIndex) => {
          await clearQueue();

          for (const entry of entries) {
            await enqueue(entry);
          }

          const queued = await getQueuedEntries();
          const safeIndex = removeIndex % queued.length;
          const removedId = queued[safeIndex].id;

          await dequeue(removedId);

          const remaining = await getQueuedEntries();
          expect(remaining).toHaveLength(entries.length - 1);

          // Remaining entries should still be in order
          for (let i = 1; i < remaining.length; i++) {
            expect(remaining[i].timestamp).toBeGreaterThanOrEqual(
              remaining[i - 1].timestamp
            );
          }

          // The removed entry should not be present
          expect(remaining.find((e) => e.id === removedId)).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

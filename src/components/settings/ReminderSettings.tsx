"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
} from "@/lib/push/push-service";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}

export function ReminderSettings() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [timezone] = useState(() =>
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (ok) {
      // Reflect whether this device is already subscribed.
      getExistingSubscription()
        .then((sub) => setEnabled(!!sub))
        .catch(() => {});
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (enabled) {
        // Subscribe first so we don't enable server-side without a device to notify.
        await subscribeToPush();
        await apiClient.put("/settings/reminders", {
          remindersEnabled: true,
          reminderHour,
          timezone,
        });
        setMessage({ type: "success", text: "Daily reminders enabled." });
      } else {
        await apiClient.put("/settings/reminders", { remindersEnabled: false });
        await unsubscribeFromPush();
        setMessage({ type: "success", text: "Reminders turned off." });
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to update reminders.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }, [enabled, reminderHour, timezone]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-lg font-semibold text-fg">Logging Reminders</h2>
      <p className="mt-1 text-sm text-muted">
        Get a browser notification if you haven&apos;t logged any entries by your chosen time.
      </p>

      {!supported ? (
        <div className="mt-4 rounded-lg bg-warning/10 p-3 text-sm text-warning" role="note">
          This device or browser doesn&apos;t support push notifications.
        </div>
      ) : (
        <>
          {message && (
            <div
              className={`mt-3 rounded-lg p-3 text-sm ${
                message.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
              role="status"
            >
              {message.text}
            </div>
          )}

          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent"
            />
            <span className="text-sm font-medium text-fg">Enable daily reminders</span>
          </label>

          {enabled && (
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="reminderHour" className="label">
                  Remind me at
                </label>
                <select
                  id="reminderHour"
                  value={reminderHour}
                  onChange={(e) => setReminderHour(parseInt(e.target.value, 10))}
                  className="input mt-1 w-40"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-faint">Timezone: {timezone}</p>
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </section>
  );
}

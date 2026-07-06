"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [timeWindow, setTimeWindow] = useState(3);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSaveTimeWindow() {
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put("/settings/time-window", { timeWindow });
      setMessage("Time window updated successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-fg">Settings</h1>
        <p className="mt-1 text-muted">
          Manage your account and pattern analysis preferences.
        </p>
      </div>

      {/* Account info */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-fg">Account</h2>
        <div className="mt-4 space-y-2 text-sm text-muted">
          <p><span className="font-medium text-fg">Email:</span> {user?.email || "—"}</p>
          <p><span className="font-medium text-fg">User ID:</span> {user?.userId || "—"}</p>
        </div>
        <button
          onClick={logout}
          className="mt-4 rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          Sign out
        </button>
      </section>

      {/* Pattern analysis settings */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-fg">Pattern Analysis</h2>
        <p className="mt-1 text-sm text-muted">
          Configure the time window for detecting correlations between your entries and symptoms.
        </p>

        {message && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${message.includes("success") ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`} role="status">
            {message}
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="timeWindow" className="label">
            Correlation time window (days)
          </label>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="timeWindow"
              type="number"
              min={1}
              max={7}
              value={timeWindow}
              onChange={(e) => setTimeWindow(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
              className="input w-20"
            />
            <span className="text-sm text-muted">1–7 days (default: 3)</span>
          </div>
        </div>

        <button
          onClick={handleSaveTimeWindow}
          disabled={saving}
          className="btn-primary mt-4"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { Card, Button, toast } from "@/components/ui";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [timeWindow, setTimeWindow] = useState(3);
  const [saving, setSaving] = useState(false);

  async function handleSaveTimeWindow() {
    setSaving(true);
    try {
      await apiClient.put("/settings/time-window", { timeWindow });
      toast.success("Time window updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your account and pattern analysis preferences.
        </p>
      </div>

      {/* Account info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-fg">Account</h2>
        <div className="mt-4 space-y-2 text-sm text-muted">
          <p><span className="font-medium text-fg">Email:</span> {user?.email || "—"}</p>
          <p><span className="font-medium text-fg">User ID:</span> {user?.userId || "—"}</p>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="mt-4 border-danger/30 text-danger hover:bg-danger/10"
        >
          Sign out
        </Button>
      </Card>

      {/* Pattern analysis settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-fg">Pattern Analysis</h2>
        <p className="mt-1 text-sm text-muted">
          Configure the time window for detecting correlations between your entries and symptoms.
        </p>

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

        <Button onClick={handleSaveTimeWindow} disabled={saving} className="mt-4">
          {saving ? "Saving..." : "Save"}
        </Button>
      </Card>

      {/* Logging reminders */}
      <ReminderSettings />
    </div>
  );
}

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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage your account and pattern analysis preferences.
        </p>
      </div>

      {/* Account info */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p><span className="font-medium text-gray-700">Email:</span> {user?.email || "—"}</p>
          <p><span className="font-medium text-gray-700">User ID:</span> {user?.userId || "—"}</p>
        </div>
        <button
          onClick={logout}
          className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Sign out
        </button>
      </section>

      {/* Pattern analysis settings */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Pattern Analysis</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure the time window for detecting correlations between your entries and symptoms.
        </p>

        {message && (
          <div className={`mt-3 rounded-md p-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`} role="status">
            {message}
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="timeWindow" className="block text-sm font-medium text-gray-700">
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
              className="w-20 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500">1–7 days (default: 3)</span>
          </div>
        </div>

        <button
          onClick={handleSaveTimeWindow}
          disabled={saving}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </section>
    </div>
  );
}

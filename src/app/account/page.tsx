"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";

export default function AccountPage() {
  const { user, hoa } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update password.");
      }

      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-xl mx-auto w-full px-8 py-10">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, ${accent}, ${shadeColor(accent, -20)})`,
            }}
          />
          <div className="px-6 py-5 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${shadeColor(accent, -20)})`,
              }}
            >
              {(user.displayName || user.email)[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-900">{user.displayName}</div>
              <div className="text-sm text-gray-400">{user.email}</div>
              <div className="text-xs text-gray-300 mt-0.5 capitalize">
                {user.role} · {hoa?.name ?? "Portal"}
              </div>
            </div>
          </div>
        </div>

        {/* Password change */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 m-0">
              Change Password
            </h2>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              Choose a strong password of at least 8 characters.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {[
              {
                label: "Current Password",
                value: current,
                onChange: setCurrent,
                autoComplete: "current-password",
              },
              {
                label: "New Password",
                value: next,
                onChange: setNext,
                autoComplete: "new-password",
              },
              {
                label: "Confirm Password",
                value: confirm,
                onChange: setConfirm,
                autoComplete: "new-password",
              },
            ].map(({ label, value, onChange, autoComplete }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  required
                  type="password"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  autoComplete={autoComplete}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <span>✅</span> Password updated successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 cursor-pointer border-0"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${shadeColor(accent, -20)})`,
              }}
            >
              {saving ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </main>

      <ComplianceFooter />
    </div>
  );
}

function shadeColor(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(
    255,
    Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)),
  );
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

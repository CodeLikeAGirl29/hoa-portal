"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import Link from "next/link";

interface ActivityItem {
  id: string;
  action: string;
  documentTitle: string | null;
  timestamp: string;
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

const ACTION_ICONS: Record<string, string> = {
  VIEW: "👁",
  DOWNLOAD: "⬇️",
  LOGIN: "🔐",
  SEARCH: "🔍",
};

export default function ProfilePage() {
  const { user, hoa, role } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";
  const accentDark = shadeColor(accent, -20);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/audit?limit=5").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/documents").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([auditData, docs]) => {
        if (auditData) setActivity(auditData.entries ?? []);
        if (docs) setDocCount(Array.isArray(docs) ? docs.length : 0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-8 py-10 space-y-6">
        {/* Profile hero */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div
            className="h-20"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
            }}
          />
          <div className="px-6 pb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold -mt-8 mb-4 border-4 border-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
              }}
            >
              {(user?.displayName || user?.email || "?")[0].toUpperCase()}
            </div>
            <h1 className="text-xl font-bold text-gray-900 m-0">
              {user?.displayName}
            </h1>
            <p className="text-sm text-gray-400 m-0 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                style={{ background: `${accent}18`, color: accent }}
              >
                {role}
              </span>
              {hoa && <span className="text-xs text-gray-400">{hoa.name}</span>}
            </div>
          </div>
        </div>

        {/* HOA info */}
        {hoa && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900 m-0">
                Your Community
              </h2>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-4 mb-4">
                {hoa.logoUrl ? (
                  <img
                    src={hoa.logoUrl}
                    alt={hoa.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
                    }}
                  >
                    {hoa.name
                      .replace(/\bHOA\b/gi, "")
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join("")}
                  </div>
                )}
                <div>
                  <div className="font-bold text-gray-900">{hoa.name}</div>
                  <div className="text-sm text-gray-400">
                    Florida HOA Portal
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: accent }}>
                    {docCount ?? "—"}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Documents Available
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {activity.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Recent Actions
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 m-0">Quick Links</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              {
                href: "/documents",
                icon: "📁",
                label: "Document Vault",
                desc: "Browse HOA documents",
              },
              {
                href: "/account",
                icon: "🔒",
                label: "Change Password",
                desc: "Update your credentials",
              },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-gray-100 hover:shadow-sm no-underline transition-all"
              >
                <span className="text-xl">{l.icon}</span>
                <span className="text-sm font-semibold text-gray-800">
                  {l.label}
                </span>
                <span className="text-xs text-gray-400">{l.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 m-0">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-8 text-center text-gray-300 text-sm">
                Loading…
              </div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center text-gray-300 text-sm">
                No activity yet
              </div>
            ) : (
              activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <span className="text-lg">
                    {ACTION_ICONS[item.action] ?? "📄"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 truncate">
                      {item.documentTitle ?? item.action}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{ background: `${accent}18`, color: accent }}
                  >
                    {item.action}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <ComplianceFooter />
    </div>
  );
}

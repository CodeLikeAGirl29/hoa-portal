"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  portalWide?: boolean;
  totalCommunities?: number;
  totalDocuments: number;
  publicDocuments: number;
  totalMembers: number;
  activeMembers: number;
  recentActivity: ActivityItem[];
  documentsByCategory: { category: string; count: number }[];
}

interface ActivityItem {
  id: string;
  action: string;
  documentTitle: string | null;
  userEmail: string;
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

const ACTION_STYLES: Record<
  string,
  { bg: string; color: string; icon: string }
> = {
  VIEW: { bg: "#E6F1FB", color: "#185FA5", icon: "👁" },
  DOWNLOAD: { bg: "#EAF3DE", color: "#3B6D11", icon: "⬇️" },
  LOGIN: { bg: "#EEEDFE", color: "#533AB7", icon: "🔐" },
  SEARCH: { bg: "#FAEEDA", color: "#854F0B", icon: "🔍" },
};

const CATEGORY_ICONS: Record<string, string> = {
  governing: "⚖️",
  financial: "💰",
  meetings: "📋",
  contracts: "📝",
  architectural: "🏗️",
  insurance: "🛡️",
  violations: "⚠️",
  legal: "🏛️",
};

export default function AdminDashboard() {
  const { user, hoa, role } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";
  const accentDark = shadeColor(accent, -20);
  const accentLight = shadeColor(accent, 90);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div
        className="px-8 py-8"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight m-0">
                Welcome back, {user.displayName.split(" ")[0]} 👋
              </h1>
              <p className="text-white/70 mt-1 text-sm m-0">
                {hoa?.name
                  ? `${hoa.name} · ${hoa.city ?? ""}, ${hoa.state ?? "FL"}`
                  : "Portal-wide overview · All communities"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/documents"
                className="px-4 py-2 rounded-xl text-sm font-semibold no-underline transition-all"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                📁 Documents
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    className="px-4 py-2 rounded-xl text-sm font-semibold no-underline transition-all"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    👥 Members
                  </Link>
                  {role === "superadmin" && (
                    <Link
                      href="/admin/hoas"
                      className="px-4 py-2 rounded-xl text-sm font-semibold no-underline transition-all"
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      🏘️ Communities
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick stats in banner */}
          {!loading && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                ...(stats.portalWide
                  ? [
                      {
                        label: "Communities",
                        value: stats.totalCommunities ?? 0,
                        icon: "🏘️",
                      },
                    ]
                  : []),
                { label: "Documents", value: stats.totalDocuments, icon: "📄" },
                {
                  label: "Public Records",
                  value: stats.publicDocuments,
                  icon: "🔓",
                },
                { label: "Members", value: stats.totalMembers, icon: "👥" },
                {
                  label: "Active Members",
                  value: stats.activeMembers,
                  icon: "✅",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-white/70 text-xs mt-0.5">
                    {s.icon} {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-48 animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents by category */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden lg:col-span-1">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-800 m-0">
                  Documents by Category
                </h2>
              </div>
              <div className="p-3">
                {stats?.documentsByCategory.length === 0 ? (
                  <div className="py-8 text-center text-gray-300 text-sm">
                    No documents yet
                  </div>
                ) : (
                  stats?.documentsByCategory.map(({ category, count }) => (
                    <div
                      key={category}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-base">
                        {CATEGORY_ICONS[category] ?? "📄"}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 capitalize">
                        {category}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: accentLight, color: accent }}
                      >
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden lg:col-span-2">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800 m-0">
                  Recent Activity
                </h2>
                <Link
                  href="/admin/audit"
                  className="text-xs font-semibold no-underline"
                  style={{ color: accent }}
                >
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {!stats?.recentActivity.length ? (
                  <div className="py-8 text-center text-gray-300 text-sm">
                    No activity yet
                  </div>
                ) : (
                  stats.recentActivity.map((item) => {
                    const s = ACTION_STYLES[item.action] ?? ACTION_STYLES.VIEW;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: s.bg }}
                        >
                          {s.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 truncate">
                            {item.documentTitle ?? "—"}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {item.userEmail}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {item.action}
                          </span>
                          <div className="text-[11px] text-gray-300 mt-0.5">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick actions */}
            {isAdmin && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden lg:col-span-3">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-800 m-0">
                    Quick Actions
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                  {[
                    {
                      href: "/documents",
                      icon: "📁",
                      label: "View Documents",
                      desc: "Browse the document vault",
                    },
                    {
                      href: "/admin/users",
                      icon: "👥",
                      label: "Manage Members",
                      desc: "Invite or edit residents",
                    },
                    {
                      href: "/admin/audit",
                      icon: "🗃️",
                      label: "Audit Trail",
                      desc: "See all document activity",
                    },
                    {
                      href: "/admin/settings",
                      icon: "⚙️",
                      label: "HOA Settings",
                      desc: "Update branding and contact",
                    },
                  ].map((a) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="flex flex-col gap-1.5 px-4 py-4 rounded-xl border border-gray-100 hover:border-current no-underline group transition-all hover:shadow-sm"
                      style={{ "--hover-color": accent } as React.CSSProperties}
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {a.label}
                      </span>
                      <span className="text-xs text-gray-400">{a.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

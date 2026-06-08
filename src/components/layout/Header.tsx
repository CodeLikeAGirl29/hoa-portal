"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/ui";

export function Header() {
  const { role, user, hoa, isLoading } = useAuth();

  const accent = hoa?.accentColor ?? "#185FA5";
  const accentDark = shadeColor(accent, -20);
  const accentLight = shadeColor(accent, 90);

  const hoaName = hoa?.name ?? "Florida HOA Portal";
  const hoaCity = hoa?.city
    ? `${hoa.city}, ${hoa.state ?? "FL"}`
    : "Serving Florida statewide";

  const isGuest = role === "public" || user.id === "anonymous";
  const isSuperAdmin = role === "superadmin";

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8 flex items-center justify-between py-4">
        {/* ── Brand ────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-4 no-underline">
          {hoa?.logoUrl ? (
            <img
              src={hoa.logoUrl}
              alt={`${hoaName} logo`}
              className="w-11 h-11 rounded-xl object-cover"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold select-none"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
              }}
            >
              {isSuperAdmin ? "🌴" : getMonogram(hoaName)}
            </div>
          )}
          <div>
            {isLoading ? (
              <div className="h-4 w-44 bg-gray-100 rounded animate-pulse mb-1" />
            ) : (
              <div
                className="text-base font-bold tracking-tight"
                style={{ color: accentDark }}
              >
                {hoaName}
              </div>
            )}
            <div className="text-[11px] text-gray-400 tracking-widest uppercase">
              {hoaCity} · F.S. 720.303
            </div>
          </div>
        </Link>

        {/* ── Nav + User ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Superadmin nav */}
          {isSuperAdmin && (
            <Link
              href="/admin/hoas"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 no-underline"
              style={{
                background: accentLight,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              🏘️ Manage HOAs
            </Link>
          )}

          {isGuest ? (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 no-underline"
              style={{
                background: accentLight,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              Sign In
            </Link>
          ) : (
            <>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">
                  {user.displayName}
                </div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>

              <RoleBadge role={role} accentColor={accent} />

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150 border border-gray-200 cursor-pointer bg-white"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Accent bar */}
      <div
        className="h-0.5"
        style={{
          background: `linear-gradient(to right, ${accent}, ${accentDark}, ${accent})`,
        }}
      />
    </header>
  );
}

function getMonogram(name: string): string {
  return name
    .replace(/\bHOA\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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

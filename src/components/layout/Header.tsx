"use client";

import { signOut } from "next-auth/react";
import type { UserRole } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/ui";

export function Header() {
  const { role, user, hoa, isLoading } = useAuth();

  // Derive accent color — fall back to HOA blue if no branding loaded yet
  const accent = hoa?.accentColor ?? "#185FA5";
  const accentDark = shadeColor(accent, -20);
  const accentLight = shadeColor(accent, 90);

  const hoaName = hoa?.name ?? "HOA Portal";
  const hoaCity = hoa?.city ? `${hoa.city}, ${hoa.state ?? "FL"}` : "Florida";

  const isGuest = role === "public" || !user.id || user.id === "anonymous";

  return (
    <header className="bg-white border-b border-gray-100 px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4">
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Logo or color-matched monogram */}
          {hoa?.logoUrl ? (
            <img
              src={hoa.logoUrl}
              alt={`${hoaName} logo`}
              className="w-11 h-11 rounded-xl object-cover"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl font-bold select-none"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
              }}
            >
              {getMonogram(hoaName)}
            </div>
          )}

          <div>
            {isLoading ? (
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-1" />
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
        </div>

        {/* ── Right side: user info + actions ───────────────────────────── */}
        <div className="flex items-center gap-3">
          {isGuest ? (
            // Not logged in — show sign-in link
            <a
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
              style={{
                background: accentLight,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              Sign In
            </a>
          ) : (
            <>
              {/* User display */}
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">
                  {user.displayName}
                </div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>

              <RoleBadge role={role} accentColor={accent} />

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150 border border-gray-200 cursor-pointer"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── HOA accent bar ──────────────────────────────────────────────── */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(to right, ${accent}, ${accentDark}, ${accent})`,
        }}
      />
    </header>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getMonogram(name: string): string {
  const words = name
    .replace(/\bHOA\b/gi, "")
    .trim()
    .split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Lighten (positive) or darken (negative) a hex color by percent */
function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(
    255,
    Math.max(0, (num >> 16) + Math.round(2.55 * percent)),
  );
  const g = Math.min(
    255,
    Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)),
  );
  const b = Math.min(
    255,
    Math.max(0, (num & 0xff) + Math.round(2.55 * percent)),
  );
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

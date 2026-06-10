"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/ui";

export function Header() {
  const { role, user, hoa, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const accent = hoa?.accentColor ?? "#185FA5";
  const accentDark = shadeColor(accent, -20);
  const accentLight = shadeColor(accent, 90);

  const hoaName = hoa?.name ?? "Florida HOA Portal";
  const hoaCity = hoa?.city
    ? `${hoa.city}, ${hoa.state ?? "FL"}`
    : "Serving Florida statewide";

  const isGuest = role === "public" || user.id === "anonymous";
  const isAdmin = role === "admin";
  const isSuperAdmin = role === "superadmin";

  const adminLinks = [
    { href: "/admin/users", label: "👥 Members" },
    { href: "/admin/settings", label: "⚙️ HOA Settings" },
    ...(isSuperAdmin ? [{ href: "/admin/hoas", label: "🏘️ Communities" }] : []),
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-100 relative z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between py-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 no-underline"
            onClick={() => setMenuOpen(false)}
          >
            {hoa?.logoUrl ? (
              <img
                src={hoa.logoUrl}
                alt={`${hoaName} logo`}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold select-none flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
                }}
              >
                {isSuperAdmin ? "🌴" : getMonogram(hoaName)}
              </div>
            )}
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              ) : (
                <div
                  className="text-sm font-bold tracking-tight truncate"
                  style={{ color: accentDark }}
                >
                  {hoaName}
                </div>
              )}
              <div className="text-[10px] text-gray-400 tracking-widest uppercase hidden sm:block">
                {hoaCity} · F.S. 720.303
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {(isAdmin || isSuperAdmin) &&
              adminLinks.map((l) => (
                <NavLink key={l.href} href={l.href}>
                  {l.label}
                </NavLink>
              ))}

            {isGuest ? (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-all"
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
                <div className="text-right mr-1 hidden lg:block">
                  <div className="text-sm font-medium text-gray-800 leading-tight">
                    {user.displayName}
                  </div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
                <RoleBadge role={role} accentColor={accent} />
                <Link
                  href="/profile"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 border border-gray-200 no-underline transition-all"
                  title="Profile"
                >
                  👤
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 cursor-pointer bg-white transition-all"
                >
                  Sign out
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-gray-600 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>

        {/* Accent bar */}
        <div
          className="h-0.5"
          style={{
            background: `linear-gradient(to right, ${accent}, ${accentDark}, ${accent})`,
          }}
        />
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100">
              {isGuest ? (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center no-underline"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
                  }}
                >
                  Sign In
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
                    }}
                  >
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <MobileNavLink href="/" onClick={() => setMenuOpen(false)}>
                🏠 Home
              </MobileNavLink>

              {(isAdmin || isSuperAdmin) && (
                <>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">
                    Admin
                  </div>
                  {adminLinks.map((l) => (
                    <MobileNavLink
                      key={l.href}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                    >
                      {l.label}
                    </MobileNavLink>
                  ))}
                </>
              )}

              {!isGuest && (
                <>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">
                    Account
                  </div>
                  <MobileNavLink
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                  >
                    👤 Profile
                  </MobileNavLink>
                  <MobileNavLink
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                  >
                    🔒 Change Password
                  </MobileNavLink>
                </>
              )}
            </nav>

            {!isGuest && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer border-0 transition-all"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 no-underline transition-all"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 no-underline transition-all"
    >
      {children}
    </Link>
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

"use client";

import type { UserRole } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/ui";

const ROLES: UserRole[] = ["public", "resident", "admin"];

export function Header() {
  const { role, setRole, user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            ⚓
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 tracking-tight">
              Pelican Bay HOA
            </div>
            <div className="text-[11px] text-gray-400 tracking-widest uppercase">
              Document Portal · F.S. 720.303
            </div>
          </div>
        </div>

        {/* Role Switcher (demo only — replace with real auth) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-1">Demo role:</span>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 cursor-pointer"
              style={{
                border: role === r ? "2px solid #185FA5" : "1px solid #ddd",
                background: role === r ? "#E6F1FB" : "#fff",
                color: role === r ? "#185FA5" : "#666",
                fontWeight: role === r ? 700 : 400,
              }}
            >
              {r}
            </button>
          ))}
          <div className="ml-2">
            <RoleBadge role={role} />
          </div>
        </div>
      </div>
    </header>
  );
}

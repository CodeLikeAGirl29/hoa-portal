"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser, UserRole } from "@/types";

// ─── Mock users for demo ───────────────────────────────────────────────────
const MOCK_USERS: Record<UserRole, AuthUser> = {
  public: {
    id: "anonymous",
    email: "anonymous",
    role: "public",
    displayName: "Public Visitor",
  },
  resident: {
    id: "resident-0047",
    email: "resident@pelicanbayhoa.org",
    role: "resident",
    displayName: "J. Martinez (Lot 47)",
  },
  admin: {
    id: "admin-001",
    email: "board@pelicanbayhoa.org",
    role: "admin",
    displayName: "Board Administrator",
  },
};

// ─── Context ───────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("public");

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: MOCK_USERS[role], role, setRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { AuthUser, HOABranding, UserRole } from "@/types";

interface AuthContextValue {
  user: AuthUser;
  role: UserRole;
  hoa: HOABranding | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Fallback for unauthenticated / loading state
const GUEST_USER: AuthUser = {
  id: "anonymous",
  email: "anonymous",
  role: "public",
  displayName: "Public Visitor",
  hoaId: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const sessionUser = session?.user as any;

  const user: AuthUser = session
    ? {
        id: sessionUser?.id ?? "unknown",
        email: sessionUser?.email ?? "",
        role: (sessionUser?.role ?? "public") as UserRole,
        displayName: sessionUser?.name ?? sessionUser?.email ?? "User",
        hoaId: sessionUser?.hoaId ?? null,
      }
    : GUEST_USER;

  const hoa: HOABranding | null = sessionUser?.hoa ?? null;
  const role = user.role;

  return (
    <AuthContext.Provider value={{ user, role, hoa, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

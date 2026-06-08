"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import type { AuthUser, HOABranding, UserRole } from "@/types";

interface AuthContextValue {
  user: AuthUser;
  role: UserRole;
  hoa: HOABranding | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_USER: AuthUser = {
  id: "anonymous",
  email: "anonymous",
  role: "public",
  displayName: "Public Visitor",
  hoaId: null,
};

// Inner consumer — must be inside SessionProvider
function AuthContextProvider({ children }: { children: ReactNode }) {
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

  return (
    <AuthContext.Provider value={{ user, role: user.role, hoa, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Outer wrapper — provides both SessionProvider and AuthContext
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import type { HOABranding } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      hoaId: string | null;
      hoa: HOABranding | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    hoaId: string | null;
    hoa: HOABranding | null;
  }
}

import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      hoaId: string;
    } & DefaultSession["user"];
  }
}

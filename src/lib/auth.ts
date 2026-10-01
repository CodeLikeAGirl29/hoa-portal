// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Error codes `authorize` can throw. NextAuth hands the message back to the
 * login page as `result.error`, so the page can tell "wrong password" apart
 * from "the database is down or not set up".
 */
export const AUTH_ERRORS = {
  databaseUnavailable: "DatabaseUnavailable",
  databaseNotMigrated: "DatabaseNotMigrated",
} as const;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email || !credentials?.password) return null;

        let user;
        try {
          user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            include: { hoa: true },
          });
        } catch (err) {
          // Without this, a database failure looks identical to a wrong
          // password — the login page just says "invalid email or password".
          console.error("Login failed — database error:", err);
          const code = (err as any)?.code;
          throw new Error(
            code === "P2021" || code === "P2022"
              ? AUTH_ERRORS.databaseNotMigrated
              : AUTH_ERRORS.databaseUnavailable
          );
        }

        if (!user || !user.active) return null;
        // A user whose community was deactivated can no longer sign in.
        if (user.hoa && !user.hoa.active) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hoaId: user.hoaId,
          // Pass full HOA branding into the session so the header can use it
          hoa: user.hoa
            ? {
                id: user.hoa.id,
                name: user.hoa.name,
                slug: user.hoa.slug,
                logoUrl: user.hoa.logoUrl,
                accentColor: user.hoa.accentColor,
                address: user.hoa.address,
                city: user.hoa.city,
                state: user.hoa.state,
                zip: user.hoa.zip,
                phone: user.hoa.phone,
                email: user.hoa.email,
              }
            : null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.hoaId = (user as any).hoaId;
        token.hoa = (user as any).hoa;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).hoaId = token.hoaId;
        (session.user as any).hoa = token.hoa;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
};

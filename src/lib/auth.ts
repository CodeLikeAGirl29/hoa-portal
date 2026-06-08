// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { hoa: true },
        });

        if (!user || !user.active) return null;

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

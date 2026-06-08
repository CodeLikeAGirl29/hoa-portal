import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "text" } },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Real database lookup
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          hoaId: user.hoaId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.hoaId = (user as any).hoaId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).hoaId = token.hoaId;
        (session.user as any).id = token.sub; // Ensure ID is mapped
      }
      return session;
    },
  },
};

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        // Replace with actual database lookup
        if (credentials?.email === "board@pelicanbayhoa.org") {
          return {
            id: "admin-001",
            name: "Board Admin",
            email: credentials.email,
            role: "admin",
          };
        }
        return {
          id: "res-001",
          name: "Resident",
          email: credentials.email,
          role: "resident",
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
  },
};

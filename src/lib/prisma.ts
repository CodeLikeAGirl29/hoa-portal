// src/lib/prisma.ts
// Prisma 7: adapter is required. Client is created lazily to avoid
// instantiation errors during Next.js static build analysis.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Lazily initialised — getter defers instantiation until first use,
// preventing build-time crashes when DATABASE_URL isn't available.
let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = global.prisma ?? createClient();
    if (process.env.NODE_ENV !== "production") global.prisma = _prisma;
  }
  return _prisma;
}

// Named export for drop-in compatibility with existing imports.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as Record<string | symbol, unknown>)[prop];
  },
});

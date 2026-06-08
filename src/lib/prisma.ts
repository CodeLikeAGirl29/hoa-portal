// src/lib/prisma.ts
// Prisma 7: adapter required in PrismaClient constructor; URL lives in prisma.config.ts.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Proxy defers instantiation until first use, so Next.js static build
// analysis doesn't try to connect to the DB at compile time.
let _client: PrismaClient | undefined;

const handler: ProxyHandler<object> = {
  get(_target, prop) {
    if (!_client) {
      _client = global.prisma ?? createClient();
      if (process.env.NODE_ENV !== "production") global.prisma = _client;
    }
    const value = (_client as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(_client) : value;
  },
};

export const prisma = new Proxy({} as PrismaClient, handler);

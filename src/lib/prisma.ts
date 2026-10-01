// src/lib/prisma.ts
// Single shared Prisma client. Prisma 7 has no built-in engine, so every
// client needs a driver adapter — here, node-postgres.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * pg currently treats sslmode=prefer|require|verify-ca as verify-full and
 * prints a long SECURITY WARNING about it on every cold start (Vercel files
 * that under runtime errors). Asking for verify-full explicitly keeps the
 * exact same behaviour and silences the warning.
 */
export function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error(
      "DATABASE_URL is not set — every database query will fail. " +
        "Add it to .env locally or to the project's environment variables."
    );
    return undefined;
  }
  if (/[?&]uselibpqcompat=true\b/.test(raw)) return raw;
  return raw.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/,
    "$1verify-full"
  );
}

const prismaClientSingleton = (): PrismaClient => {
  const pool = new Pool({
    connectionString: resolveDatabaseUrl(),
    // Serverless functions each hold their own pool, so keep it small and
    // release idle connections quickly instead of exhausting the database.
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  // Without a listener, an error on an idle connection crashes the process.
  pool.on("error", (err) => {
    console.error("Postgres pool error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma: PrismaClient =
  globalThis.prisma ?? prismaClientSingleton();

// Reuse the client across hot reloads in dev and across invocations of a
// warm serverless instance in production.
globalThis.prisma = prisma;

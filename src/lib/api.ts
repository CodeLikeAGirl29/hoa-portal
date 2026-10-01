// src/lib/api.ts
// Shared plumbing for route handlers: session lookup, role checks, request
// parsing, and one place that turns thrown errors into JSON responses.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hoaId: string | null;
}

/** Roles that can be stored on a user. */
export const ROLES = ["resident", "admin", "superadmin"] as const;

/** Throw this from a handler to return a specific status + message. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "admin" || role === "superadmin";
}

// ─── Session ───────────────────────────────────────────────────────────────

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? null,
    role: u.role ?? "resident",
    hoaId: u.hoaId ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role)) throw new ApiError(403, "Forbidden");
  return user;
}

export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "superadmin") throw new ApiError(403, "Forbidden");
  return user;
}

/**
 * Which HOA a request acts on. Everyone is pinned to their own HOA except
 * superadmins, who may name one explicitly (they usually have none).
 */
export function resolveHoaId(
  user: SessionUser,
  requested?: string | null
): string | null {
  if (user.role === "superadmin") return requested || user.hoaId || null;
  return user.hoaId;
}

// ─── Request helpers ───────────────────────────────────────────────────────

export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("not an object");
    }
    return body;
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Parses an integer query parameter, clamped to [min, max]. */
export function intParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// ─── Errors ────────────────────────────────────────────────────────────────

const CONNECTION_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "57P01",
  "57P03",
  "53300",
]);

// Prisma: table / column missing. Postgres: undefined_table / undefined_column.
const SCHEMA_CODES = new Set(["P2021", "P2022", "42P01", "42703"]);

/** Collects every error code on an error and its nested causes. */
function errorCodes(err: unknown): string[] {
  const codes: string[] = [];
  const seen = new Set<unknown>();
  let current: any = err;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (typeof current.code === "string") codes.push(current.code);
    const original = current.meta?.driverAdapterError?.cause?.originalCode;
    if (typeof original === "string") codes.push(original);
    current = current.cause;
  }
  return codes;
}

export type DatabaseProblem = "unreachable" | "schema" | null;

/** Classifies an error as a database outage, schema drift, or neither. */
export function databaseProblem(err: unknown): DatabaseProblem {
  const codes = errorCodes(err);
  if (codes.some((c) => SCHEMA_CODES.has(c))) return "schema";
  if (codes.some((c) => CONNECTION_CODES.has(c))) return "unreachable";
  const name = (err as any)?.name;
  if (name === "PrismaClientInitializationError") return "unreachable";
  return null;
}

export function errorResponse(err: unknown, label: string): Response {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  const codes = errorCodes(err);
  const problem = databaseProblem(err);

  if (problem === "schema") {
    console.error(`${label}: database schema is behind the code`, err);
    return NextResponse.json(
      {
        error:
          "The database is missing tables or columns this version needs. " +
          "Run `npx prisma migrate deploy`.",
        code: "DB_SCHEMA_OUT_OF_DATE",
      },
      { status: 503 }
    );
  }

  if (problem === "unreachable") {
    console.error(`${label}: database unreachable`, err);
    return NextResponse.json(
      {
        error: "The database is unavailable right now. Please try again.",
        code: "DB_UNAVAILABLE",
      },
      { status: 503 }
    );
  }

  if (codes.includes("P2002")) {
    return NextResponse.json(
      { error: "That value is already in use.", code: "CONFLICT" },
      { status: 409 }
    );
  }

  if (codes.includes("P2025")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Foreign key failure — most often a session for a user or HOA that no
  // longer exists (for example after the database was re-seeded).
  if (codes.includes("P2003")) {
    console.error(`${label}: foreign key violation`, err);
    return NextResponse.json(
      {
        error:
          "This refers to a record that no longer exists. " +
          "Sign out and back in, then try again.",
        code: "STALE_REFERENCE",
      },
      { status: 409 }
    );
  }

  console.error(`${label} failed:`, err);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

/**
 * Wraps a route handler so anything it throws becomes a JSON response
 * instead of an opaque 500 with an HTML body.
 *
 *   export const GET = handle("GET /api/things", async (req) => { ... });
 */
export function handle<A extends unknown[]>(
  label: string,
  fn: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      return errorResponse(err, label);
    }
  };
}

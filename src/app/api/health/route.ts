import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { databaseProblem } from "@/lib/api";

export const dynamic = "force-dynamic";

// Every table the app queries. A missing one means migrations haven't run.
const REQUIRED_TABLES = [
  "HOA",
  "User",
  "Document",
  "DocumentFile",
  "AuditLog",
  "Announcement",
  "AuthToken",
];

// GET /api/health — is the database reachable, migrated, and seeded?
// Open this in a browser whenever the site reports a database error: it says
// which of the three it is. It never exposes connection details or data.
export async function GET() {
  const result = {
    ok: false,
    database: "down" as "up" | "down",
    schema: "unknown" as "current" | "out-of-date" | "unknown",
    missingTables: [] as string[],
    seeded: false,
    hint: "",
  };

  try {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = current_schema()
    `;
    result.database = "up";

    const present = new Set(rows.map((r) => r.table_name));
    result.missingTables = REQUIRED_TABLES.filter((t) => !present.has(t));

    if (result.missingTables.length > 0) {
      result.schema = "out-of-date";
      result.hint = "Run `npx prisma migrate deploy` against this database.";
      return NextResponse.json(result, { status: 503 });
    }
    result.schema = "current";

    const [hoas, users] = await Promise.all([
      prisma.hOA.count(),
      prisma.user.count(),
    ]);
    result.seeded = hoas > 0 && users > 0;
    result.ok = true;
    if (!result.seeded) {
      result.hint =
        "The database is empty, so nobody can sign in. Run `npm run db:seed`.";
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/health:", err);
    if (databaseProblem(err) === "schema") {
      result.database = "up";
      result.schema = "out-of-date";
      result.hint = "Run `npx prisma migrate deploy` against this database.";
    } else {
      result.hint =
        "Could not reach the database. Check DATABASE_URL and that the database is running.";
    }
    return NextResponse.json(result, { status: 503 });
  }
}

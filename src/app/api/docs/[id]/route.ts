import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

// Inline redaction patterns — keeps the API route independent of the
// HOADocument shape that the Prisma Document model doesn't satisfy.
const REDACTION_PATTERNS: [RegExp, string][] = [
  [/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****"],
  [/\$[\d,]+\.\d{2}/g, "[$REDACTED]"],
  [/\b\d{10,16}\b/g, "[ACCT-REDACTED]"],
  [/\b(diagnosis|treatment|disability)\b/gi, "[MEDICAL-REDACTED]"],
];

function redactContent(content: string): string {
  let result = content;
  for (const [pattern, replacement] of REDACTION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

const RESIDENT_ACCESSIBLE = new Set([
  "governing",
  "financial",
  "meetings",
  "contracts",
  "architectural",
  "insurance",
  "violations",
]);
const PUBLIC_ACCESSIBLE = new Set(["governing", "meetings"]);

function canAccessCategory(category: string, role: UserRole): boolean {
  if (role === "admin") return true;
  if (role === "resident") return RESIDENT_ACCESSIBLE.has(category);
  return PUBLIC_ACCESSIBLE.has(category);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as
      | { id: string; role: string; hoaId: string }
      | undefined;

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await prisma.document.findFirst({
      where: { id, hoaId: user.hoaId },
    });

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = user.role as UserRole;

    if (!canAccessCategory(doc.category, role)) {
      await prisma.auditLog.create({
        data: {
          hoaId: user.hoaId,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          userId: user.id,
        },
      });
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await prisma.auditLog.create({
      data: { hoaId: user.hoaId, action: "VIEW", userId: user.id },
    });

    const content = role === "admin" ? doc.content : redactContent(doc.content);
    return NextResponse.json({ ...doc, content }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

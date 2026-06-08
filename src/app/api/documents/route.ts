import { NextResponse } from "next/server";
import { MOCK_DOCUMENTS } from "@/lib/data";
import type { HOADocument, DocumentCategory, UserRole } from "@/types";
import { redactDocument } from "@/lib/redaction";

const RESIDENT_CATEGORIES = new Set<DocumentCategory>([
  "governing",
  "financial",
  "meetings",
  "contracts",
  "architectural",
  "insurance",
  "violations",
]);
const PUBLIC_CATEGORIES = new Set<DocumentCategory>(["governing", "meetings"]);

function canAccess(doc: HOADocument, role: UserRole): boolean {
  if (role === "admin") return true;
  if (role === "resident") return doc.isAccessibleToResidents;
  return doc.isPublic;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const category = searchParams.get("category") ?? "all";

  // The demo app uses a role header sent by DocumentVault.tsx.
  // In production this would come from a verified session cookie.
  const role = (req.headers.get("x-demo-role") ?? "public") as UserRole;

  const results = MOCK_DOCUMENTS.filter((doc) => canAccess(doc, role))
    .filter((doc) => category === "all" || doc.category === category)
    .filter(
      (doc) =>
        search === "" ||
        doc.title.toLowerCase().includes(search) ||
        doc.category.toLowerCase().includes(search)
    )
    .map((doc) => redactDocument(doc, role));

  return NextResponse.json(results);
}

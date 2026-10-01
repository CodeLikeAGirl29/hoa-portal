// src/lib/public-hoa.ts
// Read-only queries behind the pages anyone can see without signing in.
import { prisma } from "@/lib/prisma";
import { FILE_META_SELECT, presentDocument } from "@/lib/documents";

const PUBLIC_HOA_FIELDS = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  accentColor: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  phone: true,
  email: true,
  website: true,
} as const;

/** One active community and its public documents, or null if none matches. */
export async function getPublicHoa(slug: string) {
  const hoa = await prisma.hOA.findFirst({
    where: { slug, active: true },
    select: PUBLIC_HOA_FIELDS,
  });
  if (!hoa) return null;

  const documents = await prisma.document.findMany({
    where: { hoaId: hoa.id, isPublic: true },
    orderBy: [{ category: "asc" }, { uploadDate: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      fileSize: true,
      pages: true,
      uploadDate: true,
      lastModified: true,
      isMandatoryRecord: true,
    },
  });

  return { hoa, documents };
}

/** Every active community, with how many public documents each publishes. */
export async function listPublicHoas() {
  const [hoas, counts] = await Promise.all([
    prisma.hOA.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        accentColor: true,
        city: true,
        state: true,
      },
    }),
    prisma.document.groupBy({
      by: ["hoaId"],
      where: { isPublic: true },
      _count: { _all: true },
    }),
  ]);

  const byHoa = new Map(counts.map((c) => [c.hoaId, c._count._all]));
  return hoas.map((h) => ({ ...h, publicDocuments: byHoa.get(h.id) ?? 0 }));
}

/**
 * One public document of an active community, with its text redacted the
 * way any visitor sees it. Null if the community or document doesn't exist
 * or the document isn't public.
 */
export async function getPublicDocument(slug: string, documentId: string) {
  const hoa = await prisma.hOA.findFirst({
    where: { slug, active: true },
    select: PUBLIC_HOA_FIELDS,
  });
  if (!hoa) return null;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, hoaId: hoa.id, isPublic: true },
    include: { file: { select: FILE_META_SELECT } },
  });
  if (!doc) return null;

  return { hoa, document: presentDocument(doc, "public") };
}

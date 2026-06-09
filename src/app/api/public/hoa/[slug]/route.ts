import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/hoa/[slug]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const hoa = await prisma.hOA.findUnique({
    where: { slug, active: true },
    select: {
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
    },
  });

  if (!hoa) {
    return NextResponse.json(
      { error: "Community not found." },
      { status: 404 }
    );
  }

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

  return NextResponse.json({ hoa, documents });
}

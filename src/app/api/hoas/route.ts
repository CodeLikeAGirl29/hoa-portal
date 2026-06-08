import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hoas — list all HOAs (superadmin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hoas = await prisma.hOA.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, documents: true } },
    },
  });

  return NextResponse.json(hoas);
}

// POST /api/hoas — create a new HOA (superadmin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    slug,
    accentColor,
    address,
    city,
    state,
    zip,
    phone,
    email,
    website,
  } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Name and slug are required." },
      { status: 400 }
    );
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      {
        error: "Slug may only contain lowercase letters, numbers, and hyphens.",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.hOA.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A community with that slug already exists." },
      { status: 409 }
    );
  }

  const hoa = await prisma.hOA.create({
    data: {
      name,
      slug,
      accentColor: accentColor ?? "#185FA5",
      address: address || null,
      city: city || null,
      state: state || "FL",
      zip: zip || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
    },
  });

  return NextResponse.json(hoa, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireSuperadmin } from "@/lib/api";

const SLUG_RE = /^[a-z0-9-]+$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// GET /api/hoas — list all HOAs (superadmin only)
export const GET = handle("GET /api/hoas", async () => {
  await requireSuperadmin();

  const hoas = await prisma.hOA.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, documents: true } },
    },
  });

  return NextResponse.json(hoas);
});

// POST /api/hoas — create a new HOA (superadmin only)
export const POST = handle("POST /api/hoas", async (req: Request) => {
  await requireSuperadmin();

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
  } = await readJson(req);

  if (!name || !String(name).trim() || !slug) {
    throw new ApiError(400, "Name and slug are required.");
  }
  if (!SLUG_RE.test(slug)) {
    throw new ApiError(
      400,
      "Slug may only contain lowercase letters, numbers, and hyphens."
    );
  }
  // The accent colour is interpolated into inline styles and email HTML.
  if (accentColor && !COLOR_RE.test(accentColor)) {
    throw new ApiError(400, "Accent color must be a hex value like #185FA5.");
  }

  const existing = await prisma.hOA.findUnique({ where: { slug } });
  if (existing) {
    throw new ApiError(409, "A community with that slug already exists.");
  }

  const hoa = await prisma.hOA.create({
    data: {
      name: String(name).trim(),
      slug,
      accentColor: accentColor || "#185FA5",
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
});

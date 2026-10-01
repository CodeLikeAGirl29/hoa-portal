import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireSuperadmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const SLUG_RE = /^[a-z0-9-]+$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// PATCH /api/hoas/[id] — update an HOA
export const PATCH = handle(
  "PATCH /api/hoas/[id]",
  async (req: Request, { params }: Ctx) => {
    await requireSuperadmin();

    const { id } = await params;
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
      active,
    } = await readJson(req);

    const existing = await prisma.hOA.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "HOA not found.");

    if (name !== undefined && !String(name).trim()) {
      throw new ApiError(400, "Name cannot be empty.");
    }
    if (slug !== undefined && !SLUG_RE.test(slug)) {
      throw new ApiError(
        400,
        "Slug may only contain lowercase letters, numbers, and hyphens."
      );
    }
    if (accentColor !== undefined && !COLOR_RE.test(accentColor)) {
      throw new ApiError(400, "Accent color must be a hex value like #185FA5.");
    }
    if (slug !== undefined && slug !== existing.slug) {
      const clash = await prisma.hOA.findUnique({ where: { slug } });
      if (clash) {
        throw new ApiError(409, "A community with that slug already exists.");
      }
    }

    const hoa = await prisma.hOA.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(slug !== undefined && { slug }),
        ...(accentColor !== undefined && { accentColor }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || "FL" }),
        ...(zip !== undefined && { zip: zip || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(website !== undefined && { website: website || null }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json(hoa);
  }
);

// DELETE /api/hoas/[id] — deactivate (soft delete) an HOA
export const DELETE = handle(
  "DELETE /api/hoas/[id]",
  async (_req: Request, { params }: Ctx) => {
    await requireSuperadmin();

    const { id } = await params;

    const existing = await prisma.hOA.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "HOA not found.");

    // Soft delete — set active: false rather than destroying data
    const hoa = await prisma.hOA.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, hoa });
  }
);

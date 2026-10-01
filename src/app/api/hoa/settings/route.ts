import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  readJson,
  requireAdmin,
  resolveHoaId,
} from "@/lib/api";
import type { SessionUser } from "@/lib/api";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function settingsHoaId(user: SessionUser, requested: string | null): string {
  const hoaId = resolveHoaId(user, requested);
  if (!hoaId) throw new ApiError(400, "No HOA assigned to your account.");
  return hoaId;
}

// GET /api/hoa/settings — the current user's HOA
export const GET = handle("GET /api/hoa/settings", async (req: Request) => {
  const user = await requireAdmin();
  const hoaId = settingsHoaId(user, new URL(req.url).searchParams.get("hoaId"));

  const hoa = await prisma.hOA.findUnique({ where: { id: hoaId } });
  if (!hoa) throw new ApiError(404, "HOA not found.");

  return NextResponse.json(hoa);
});

// PATCH /api/hoa/settings — update the current user's HOA
export const PATCH = handle("PATCH /api/hoa/settings", async (req: Request) => {
  const user = await requireAdmin();
  const hoaId = settingsHoaId(user, new URL(req.url).searchParams.get("hoaId"));

  const {
    name,
    logoUrl,
    accentColor,
    address,
    city,
    state,
    zip,
    phone,
    email,
    website,
  } = await readJson(req);

  if (name !== undefined && !String(name).trim()) {
    throw new ApiError(400, "Name cannot be empty.");
  }
  if (accentColor !== undefined && !COLOR_RE.test(accentColor)) {
    throw new ApiError(400, "Accent color must be a hex value like #185FA5.");
  }
  // The logo is rendered as an <img src>, so only allow web addresses.
  if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
    throw new ApiError(400, "Logo URL must start with http:// or https://.");
  }

  const existing = await prisma.hOA.findUnique({ where: { id: hoaId } });
  if (!existing) throw new ApiError(404, "HOA not found.");

  const hoa = await prisma.hOA.update({
    where: { id: hoaId },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(accentColor !== undefined && { accentColor }),
      ...(address !== undefined && { address: address || null }),
      ...(city !== undefined && { city: city || null }),
      ...(state !== undefined && { state: state || "FL" }),
      ...(zip !== undefined && { zip: zip || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(email !== undefined && { email: email || null }),
      ...(website !== undefined && { website: website || null }),
    },
  });

  return NextResponse.json(hoa);
});

import { NextResponse } from "next/server";
import { ApiError, handle, requireAdmin } from "@/lib/api";
import { loadManagedUser, sendPasswordLink } from "@/lib/users";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/users/[id]/invite — email a member a fresh link to set their
// password. Works for a new member who never used their invitation and for
// an existing member who is locked out.
export const POST = handle(
  "POST /api/users/[id]/invite",
  async (req: Request, { params }: Ctx) => {
    const sessionUser = await requireAdmin();
    const { id } = await params;

    const target = await loadManagedUser(id, sessionUser);
    if (!target.active) {
      throw new ApiError(400, "Reactivate this member before sending a link.");
    }

    const delivery = await sendPasswordLink(
      target,
      "invite",
      sessionUser.name ?? sessionUser.email,
      req
    );

    return NextResponse.json(delivery);
  }
);

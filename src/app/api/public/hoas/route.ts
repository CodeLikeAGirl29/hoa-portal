import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { listPublicHoas } from "@/lib/public-hoa";

// GET /api/public/hoas — directory of active communities, for visitors who
// arrive without a community link.
export const GET = handle("GET /api/public/hoas", async () => {
  return NextResponse.json(await listPublicHoas());
});

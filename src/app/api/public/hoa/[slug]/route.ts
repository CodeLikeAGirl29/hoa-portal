import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { getPublicHoa } from "@/lib/public-hoa";

type Ctx = { params: Promise<{ slug: string }> };

// GET /api/public/hoa/[slug] — one community and its public documents
export const GET = handle(
  "GET /api/public/hoa/[slug]",
  async (_req: Request, { params }: Ctx) => {
    const { slug } = await params;

    const data = await getPublicHoa(slug);
    if (!data) throw new ApiError(404, "Community not found.");

    return NextResponse.json(data);
  }
);

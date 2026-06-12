import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as any;
    const role = token?.role ?? "public";

    // /admin/hoas is superadmin-only
    if (pathname.startsWith("/admin/hoas") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // All other /admin/* routes require admin OR superadmin
    if (
      pathname.startsWith("/admin") &&
      role !== "admin" &&
      role !== "superadmin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes — allowed with or without a token
        const publicPaths = [
          "/login",
          "/api/auth",
          "/api/documents",
          "/api/docs",
          "/api/public",
          "/api/announcements",
          "/hoa",
          "/documents",
          "/_next",
          "/favicon",
        ];
        if (
          pathname === "/" ||
          publicPaths.some((p) => pathname.startsWith(p))
        ) {
          return true;
        }

        // Everything else requires a valid token
        return !!token;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

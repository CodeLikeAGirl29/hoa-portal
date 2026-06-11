import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as any;
    const role = token?.role ?? "public";

    // Superadmin-only routes
    if (
      pathname.startsWith("/admin") &&
      role !== "superadmin" &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Superadmin-only: /admin/hoas
    if (pathname.startsWith("/admin/hoas") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always public (Let the API routes handle their own security)
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/documents") ||
          pathname.startsWith("/api/docs") ||
          pathname.startsWith("/api/public") ||
          pathname.startsWith("/api/announcements") ||
          pathname.startsWith("/hoa") ||
          pathname.startsWith("/documents") || // ← fix: allow /documents page
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname === "/"
        ) {
          return true; // Allows access with OR without a token
        }

        // Everything else requires an active session token
        return !!token;
      },
    },
  }
);

// We can simplify the matcher now that the callback handles the specific exclusions
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

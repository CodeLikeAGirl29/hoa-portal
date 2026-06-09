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

        // Always public
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname === "/"
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)"],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as any;
    const role = token?.role ?? "public";

    // Superadmin-only routes
    if (pathname.startsWith("/admin") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Resident + admin routes (not public)
    if (pathname.startsWith("/documents") && role === "public") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow the middleware function to run even for unauthenticated users
      // so we can redirect them to /login ourselves
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // These paths are always public
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon")
        ) {
          return true;
        }

        // Everything else requires a token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - /login (auth page)
     * - /api/auth (NextAuth endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)",
  ],
};

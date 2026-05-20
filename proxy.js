import { NextResponse } from "next/server";

export function proxy(request) {
  const path = request.nextUrl.pathname;

  // Define public paths
  const isPublicPath =
    path === "/login" ||
    path === "/login/core" ||
    path.startsWith("/api/auth/seed") ||
    path.startsWith("/api/core/auth/list") ||
    path.startsWith("/api/core/auth/seed") ||
    path.startsWith("/api/core/auth/login");

  // Get the tokens from cookies
  const founderToken = request.cookies.get("mallzo_auth_token")?.value || "";
  const coreToken = request.cookies.get("mallzo_core_auth_token")?.value || "";

  // Redirect authenticated users trying to access login
  if (isPublicPath && (path === "/login" || path === "/login/core")) {
    if (founderToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (coreToken) {
      return NextResponse.redirect(new URL("/core", request.url));
    }
    return NextResponse.next();
  }

  // Protect Core Member routes
  const isCorePath = path === "/core" || path.startsWith("/core/");
  if (isCorePath && !coreToken) {
    return NextResponse.redirect(new URL("/login/core", request.url));
  }

  // Protect Founder routes
  const isFounderPath =
    path === "/" ||
    path.startsWith("/analytics") ||
    path.startsWith("/future-analysis") ||
    path.startsWith("/core-members");

  if (isFounderPath && !founderToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect API routes
  if (path.startsWith("/api/")) {
    // 1. Skip checks for public auth endpoints
    if (
      path.startsWith("/api/auth") ||
      path.startsWith("/api/core/auth")
    ) {
      return NextResponse.next();
    }

    // 2. Protect Core Member APIs
    if (path.startsWith("/api/core/")) {
      if (!coreToken) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized core access. Please log in." }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return NextResponse.next();
    }

    // 3. Protect Founder APIs
    if (!founderToken) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized founder access. Please log in." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return NextResponse.next();
}

// Config to match routes
export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/analytics/:path*",
    "/future-analysis/:path*",
    "/core-members/:path*",
    "/core/:path*",
    "/api/:path*",
  ],
};

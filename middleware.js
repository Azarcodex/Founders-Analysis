import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require auth
  const isPublicPath = path === "/login" || path.startsWith("/api/auth/seed");

  // Get the auth token from cookies
  const token = request.cookies.get("mallzo_auth_token")?.value || "";

  // If path is public and token is present, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If path is protected and token is absent, redirect to login page
  const isProtectedPath =
    path === "/" ||
    path.startsWith("/analytics") ||
    path.startsWith("/future-analysis");

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect API routes except auth endpoints
  if (path.startsWith("/api/") && !path.startsWith("/api/auth") && !token) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized access. Please log in." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return NextResponse.next();
}

// Config to match routes
export const config = {
  matcher: [
    "/",
    "/login",
    "/analytics/:path*",
    "/future-analysis/:path*",
    "/api/:path*",
  ],
};

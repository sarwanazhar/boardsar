import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedRoutes = ["/board"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedRoute) {
    // check cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/board/:path*"],
};

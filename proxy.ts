import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildLoginCallbackUrl, buildRequestUrl } from "@/lib/auth-redirect";

const publicRoutes = new Set(["/login", "/pending", "/denied"]);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;
  const status = session?.user?.status;
  const role = session?.user?.role;

  if (!session?.user) {
    const loginUrl = buildRequestUrl(req, "/login");
    loginUrl.searchParams.set(
      "callbackUrl",
      buildLoginCallbackUrl(pathname, nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/settings/admin") && role !== "ADMIN") {
    return NextResponse.redirect(buildRequestUrl(req, "/finance"));
  }

  if (status === "PENDING" && !publicRoutes.has(pathname)) {
    return NextResponse.redirect(buildRequestUrl(req, "/pending"));
  }

  if (status === "REJECTED" && !publicRoutes.has(pathname)) {
    return NextResponse.redirect(buildRequestUrl(req, "/denied"));
  }

  if (status === "APPROVED" && (pathname === "/pending" || pathname === "/denied")) {
    return NextResponse.redirect(buildRequestUrl(req, "/finance"));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/finance/:path*",
    "/calendar/:path*",
    "/todo-routine/:path*",
    "/mandalart/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};

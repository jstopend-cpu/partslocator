import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/register(.*)",
  "/api/verify-afm",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const pathname = req.nextUrl.pathname;
  const authObj = await auth();
  const claims = authObj.sessionClaims as { metadata?: { role?: string; supplierId?: string }; public_metadata?: { role?: string; supplierId?: string } };
  const metadata = claims?.metadata ?? claims?.public_metadata;
  const role = metadata?.role;
  const isSupplier = role === "SUPPLIER";

  if (isSupplier && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
  }
  if (pathname.startsWith("/supplier") && !isSupplier) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isSupplier && (pathname === "/" || pathname === "")) {
    return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
// Build trigger: 2026-03-14-v1
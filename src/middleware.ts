import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes: landing, auth, help (for "Επικοινωνία με τις πωλήσεις" from landing)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in',
  '/sign-in(.*)',
  '/sign-up',
  '/sign-up(.*)',
  '/dashboard/help',
  '/api/webhooks/clerk(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Αν η διαδρομή ΔΕΝ είναι δημόσια, απαιτείται προστασία (auth.protect)
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Προστατεύει όλες τις διαδρομές εκτός από στατικά αρχεία και next internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
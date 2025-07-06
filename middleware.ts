import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/webhook/clerk(.*)', '/api/public-chat(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Get authentication status
  const authObj = await auth();
  const userId = authObj.userId;
  const path = req.nextUrl.pathname;
  
  // If user is not authenticated and trying to access the root page, redirect to sign-in
  if (!userId && path === '/') {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // For public routes, don't require authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Protect all other routes
  await auth.protect();

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    
  if (isAdminRoute) {
    // Fetch user data to check role
    const client = await clerkClient()
    // Check if user has admin role (using Clerk metadata)
    const user = await client.users.getUser(userId!);
    const isAdmin = user.privateMetadata.role === "admin";
    
    if (!isAdmin) {
      // Redirect non-admin users trying to access admin routes
      const homeUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(homeUrl);
    }
  }
  
  return NextResponse.next();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
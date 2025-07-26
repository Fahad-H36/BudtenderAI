import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/terms',
  '/api/webhook/clerk(.*)', 
  '/api/public-chat(.*)',
  '/api/guest-thread(.*)',
  '/api/chat(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // For public routes, don't require authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Protect admin routes only
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  
  if (isAdminRoute) {
    await auth.protect();
    
    const client = await clerkClient();
    const { userId } = await auth();
    const user = await client.users.getUser(userId!);
    
    // Check if user has admin role
    const isAdmin = user.privateMetadata.role === "admin";
    
    if (!isAdmin) {
      const homeUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(homeUrl);
    }
  } else {
    // For non-admin protected routes, just ensure authentication
    await auth.protect();
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
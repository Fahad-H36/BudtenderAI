import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      // Not authenticated, so not an admin
      return NextResponse.json({ isAdmin: false });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user) {
      // User not found in Clerk, should not happen if authenticated
      return NextResponse.json({ isAdmin: false, error: 'User not found' }, { status: 404 });
    }

    // Check the role from privateMetadata
    const isAdminUser = user.privateMetadata?.role === 'admin';
    
    return NextResponse.json({ isAdmin: isAdminUser });

  } catch (error) {
    console.error('[API /check-admin] Error checking admin status:', error);
    // Return isAdmin: false in case of any error to be safe
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 });
  }
} 
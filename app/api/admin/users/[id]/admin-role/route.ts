import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// PATCH /api/admin/users/[id]/admin-role - Update user's admin role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await auth();
    const { userId: currentUserId } = authResult;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const isCurrentUserAdmin = currentUser.privateMetadata?.role === 'admin';

    if (!isCurrentUserAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { isAdmin } = await req.json();

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'isAdmin must be a boolean value' },
        { status: 400 }
      );
    }

    // Prevent admin from removing their own admin rights
    if (targetUserId === currentUserId && !isAdmin) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    try {
      // Get the target user
      const targetUser = await client.users.getUser(targetUserId);
      
      // Update the user's private metadata
      let updatedMetadata: Record<string, unknown>;
      
      if (isAdmin) {
        updatedMetadata = {
          ...targetUser.privateMetadata,
          role: 'admin'
        };
      } else {
        // Create new metadata object without the role property
        const currentMetadata = targetUser.privateMetadata || {};
        updatedMetadata = Object.keys(currentMetadata)
          .filter(key => key !== 'role')
          .reduce((acc, key) => {
            acc[key] = currentMetadata[key];
            return acc;
          }, {} as Record<string, unknown>);
      }

      await client.users.updateUserMetadata(targetUserId, {
        privateMetadata: updatedMetadata
      });

      return NextResponse.json({
        success: true,
        message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
        isAdmin: isAdmin
      });

    } catch (clerkError) {
      console.error('Error updating user metadata in Clerk:', clerkError);
      return NextResponse.json(
        { error: 'User not found or failed to update admin status' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users/[id]/admin-role:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
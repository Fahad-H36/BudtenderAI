import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import supabase from '@/lib/supabaseClient';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id] - Get specific user details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.privateMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user from Supabase
    const { data: userData, error: supabaseError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (supabaseError) {
      console.error('Error fetching user from Supabase:', supabaseError);
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user from Clerk for additional details
    try {
      const clerkUser = await client.users.getUser(targetUserId);
      
      // Combine data from both sources
      const combinedUserData = {
        ...userData,
        clerk_data: {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          emailAddresses: clerkUser.emailAddresses,
          createdAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt,
          publicMetadata: clerkUser.publicMetadata,
        }
      };

      return NextResponse.json(combinedUserData);
    } catch (clerkError) {
      // If user not found in Clerk, return Supabase data only
      console.warn('User not found in Clerk:', clerkError);
      return NextResponse.json({
        ...userData,
        clerk_data: null
      });
    }

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update specific user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.privateMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData = await req.json();
    
    // Add updated_at timestamp and ensure user_id cannot be updated
    const safeUpdateData = { ...updateData };
    delete safeUpdateData.user_id; // Remove user_id if present
    safeUpdateData.updated_at = new Date().toISOString();

    // Update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(safeUpdateData)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user in Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user: data,
      message: 'User updated successfully' 
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete specific user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.privateMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    try {
      // Delete from Clerk first
      await client.users.deleteUser(targetUserId);
    } catch (clerkError) {
      console.warn('Failed to delete user from Clerk (user may not exist):', clerkError);
      // Continue with Supabase deletion even if Clerk deletion fails
    }

    // Delete from Supabase
    const { error: supabaseError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', targetUserId);

    if (supabaseError) {
      console.error('Error deleting user from Supabase:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to delete user from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully' 
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import supabase from '@/lib/supabaseClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/users - Get all users with admin status
export async function GET(req: NextRequest) {
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

    // Parse query parameters (for searching and filtering)
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    // Initialize query - only select columns that exist in our schema
    let query = supabase.from('users').select('user_id, user_email, created_at, updated_at');
    
    // Apply filters if they exist
    if (email) {
      query = query.ilike('user_email', `%${email}%`);
    }
    
    // Execute the query with ordering
    const { data: supabaseUsers, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Enrich with Clerk data including admin status
    const enrichedUsers = await Promise.all(
      supabaseUsers.map(async (supabaseUser) => {
        try {
          const clerkUser = await client.users.getUser(supabaseUser.user_id);
          return {
            ...supabaseUser,
            isAdmin: clerkUser.privateMetadata?.role === 'admin',
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            lastSignInAt: clerkUser.lastSignInAt,
            emailAddresses: clerkUser.emailAddresses
          };
        } catch (clerkError) {
          // If user not found in Clerk, return with basic info
          console.warn(`User ${supabaseUser.user_id} not found in Clerk:`, clerkError);
          return {
            ...supabaseUser,
            isAdmin: false,
            firstName: null,
            lastName: null,
            imageUrl: null,
            lastSignInAt: null,
            emailAddresses: []
          };
        }
      })
    );
    
    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


// PATCH /api/admin/users/:id - Update a user
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    let userId = params ? params.id : null;
    
    if (!userId) {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const idIndex = pathParts.indexOf('users') + 1;
      
      if (idIndex < pathParts.length) {
        userId = pathParts[idIndex];
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const userData = await req.json();
    
    // Remove user_id from update data and add updated_at timestamp
    const { ...updateData } = userData;
    updateData.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/:id - Delete a user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    let userId = params ? params.id : null;
    
    if (!userId) {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const idIndex = pathParts.indexOf('users') + 1;
      
      if (idIndex < pathParts.length) {
        userId = pathParts[idIndex];
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
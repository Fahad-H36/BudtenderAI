import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from request body
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      console.error('Error checking for existing user:', fetchError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log('Creating new user in database:', { userId, userEmail });
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          user_email: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      console.log('User created successfully');
      return NextResponse.json({ 
        success: true, 
        created: true,
        message: 'User created successfully' 
      });
    } else {
      console.log('User already exists in database');
      return NextResponse.json({ 
        success: true, 
        created: false,
        message: 'User already exists' 
      });
    }

  } catch (error) {
    console.error('Unexpected error in ensure-user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  try {
    // Get all chat history records with user information
    const { data: chatHistoryData, error: chatHistoryError } = await supabase
      .from('chat_history')
      .select('user_id, threads');

    if (chatHistoryError) {
      console.error('Error fetching chat history:', chatHistoryError);
      return NextResponse.json(
        { error: 'Failed to fetch chat history' },
        { status: 500 }
      );
    }

    // Get all user information
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('user_id, user_email, created_at');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Create a map of users for quick lookup
    const usersMap = new Map(usersData?.map(user => [user.user_id, user]) || []);

    // Process chat history and combine with user information
    const allChats = [];
    
    for (const chatHistory of chatHistoryData || []) {
      const user = usersMap.get(chatHistory.user_id);
      
      if (chatHistory.threads && Array.isArray(chatHistory.threads)) {
        for (const thread of chatHistory.threads) {
          allChats.push({
            user_id: chatHistory.user_id,
            user_email: user?.user_email || 'Unknown',
            user_name: user?.user_email ? user.user_email.split('@')[0] : 'Unknown',
            plan_type: 'free', // Default since we don't have this field
            thread_id: thread.thread_id,
            thread_name: thread.name,
            created_at: thread.created_at,
            last_message_at: thread.last_message_at || thread.created_at,
            is_most_recent: thread.is_most_recent || false,
            summary: thread.summary || null
          });
        }
      }
    }

    // Sort by last_message_at (most recent first)
    allChats.sort((a, b) => {
      const dateA = new Date(a.last_message_at || a.created_at).getTime();
      const dateB = new Date(b.last_message_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(allChats);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST() {
  try {
    // Create a new thread for guest users
    const thread = await openai.beta.threads.create({
      metadata: {
        user_type: 'guest',
        created_at: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      threadId: thread.id,
      success: true 
    });
  } catch (error) {
    console.error('Error creating guest thread:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create guest thread',
        success: false 
      },
      { status: 500 }
    );
  }
} 
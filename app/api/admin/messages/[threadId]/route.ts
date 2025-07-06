import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Fetch messages from OpenAI thread
    const messagesResponse = await openai.beta.threads.messages.list(threadId, {
      order: 'asc' // Get messages in chronological order
    });

    const messages = messagesResponse.data.map((message) => {
      const content = message.content[0];
      let messageContent = '';
      let attachments: Array<{id: string, name: string, type: string}> = [];

      if (content.type === 'text') {
        messageContent = content.text.value;
      }

      // Handle attachments if present
      if (message.attachments && message.attachments.length > 0) {
        attachments = message.attachments.map((attachment) => ({
          id: attachment.file_id || '',
          name: `attachment_${attachment.file_id}`,
          type: 'file'
        }));
      }

      return {
        id: message.id,
        role: message.role,
        content: messageContent,
        created_at: new Date(message.created_at * 1000).toISOString(),
        attachments
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
"use server";
import openai from "./openai";
import { Uploadable } from "openai/uploads.mjs";
import supabase from "@/supabaseClient";

export const createThread = async () => {
  const thread = await openai.beta.threads.create();
  return JSON.parse(JSON.stringify(thread));
};

export const checkUserExists = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('threads')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error checking user existence:', error);
    console.log("error checking user");
    return "";
  }

  // If data exists and threads is an array with elements
  if (data?.threads && Array.isArray(data.threads) && data.threads.length > 0) {
    const lastThread = data.threads[data.threads.length - 1];
    console.log(`Last thread found: ${lastThread.thread_id} with name: ${lastThread.name}`);
    return lastThread.thread_id; // Returns "thread_OQfxHYRWuwVNci2qCdXh1kv4" for your sample data
  }

  console.log(`No threads found for restaurant user: ${userId}`);
  return "";
}

interface ChatItem {
  thread_id: string;
  name: string;
  restaurant_key?: string;
  created_at: string;
  summary?: string | null;
  last_message_at: string;
  is_most_recent: boolean;
}

export const getUserChats = async (userId: string): Promise<ChatItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('threads')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found for this user
        return []
      }
      throw error
    }

    if (!data || !data.threads) {
      return []
    }

    // Ensure that the returned data matches the ChatItem interface
    const chats: ChatItem[] = data.threads.map((thread: any) => ({
      thread_id: thread.thread_id,
      name: thread.name,
      restaurant_key: thread.restaurant_key || '',
      created_at: thread.created_at || new Date().toISOString(),
      last_message_at: thread.last_message_at || thread.created_at || new Date().toISOString(),
      is_most_recent: thread.is_most_recent || false,
      summary: thread.summary || null
    }))

    return chats
  } catch (error) {
    console.error('Error getting user chats:', error)
    return []
  }
}

export const getMostRecentThread = async (userId: string): Promise<ChatItem | null> => {
  try {
    const chats = await getUserChats(userId);
    
    // First try to find a thread marked as most recent
    const mostRecentThread = chats.find(chat => chat.is_most_recent);
    if (mostRecentThread) {
      return mostRecentThread;
    }
    
    // If no thread is marked as most recent, use the one with the latest last_message_at
    if (chats.length > 0) {
      return chats.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      })[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting most recent thread:', error);
    return null;
  }
}

export const addChatHistory = async (userId:string, threadId:string, threadName:string) => {
  try {
    // Input validation
    if (!userId || !threadId || !threadName) {
      console.error('Invalid input to addChatHistory:', { userId, threadId, threadName });
      return [];
    }

    // First, check if the user already exists in the table
    const { data, error } = await supabase
      .from('chat_history')
      .select('threads')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine if the user doesn't exist yet
      throw error
    }

    const now = new Date().toISOString();
    
    let newThreads;
    if (data) {
      // User exists, append new thread to existing threads and mark all others as not most recent
      newThreads = data.threads.map((thread: any) => {
        const { is_most_recent, ...restThread } = thread;
        return restThread;
      });
      
      // Add the new thread with is_most_recent flag
      newThreads.push({
        thread_id: threadId,
        name: threadName,
        created_at: now,
        last_message_at: now,
        is_most_recent: true // This new thread is now the most recent
      });
    } else {
      // User doesn't exist, create new threads array with the one thread
      newThreads = [{
        thread_id: threadId,
        name: threadName,
        created_at: now,
        last_message_at: now,
        is_most_recent: true // This thread is the most recent by default
      }];
    }

    // Upsert the data
    const { error: upsertError } = await supabase
      .from('chat_history')
      .upsert({ 
        user_id: userId,
        threads: newThreads
      })

    if (upsertError) throw upsertError
    
    const chats = await getUserChats(userId)
    return chats
  } catch (error:any) {
    console.error('Error adding chat history:', error)
    return []
  }
}

// Define an interface for the message structure returned by getMessages
interface SimpleMessage {
  role: string;
  content: string;
}

export const getMessages = async (thread_id:string) => {
  const response = await openai.beta.threads.messages.list(thread_id, {limit:100});

  var messages = JSON.parse(JSON.stringify(response)).data
  return messages.map((msg: any) => ({
    role: msg.assistant_id ? "assistant" : "user",
    content: msg.content[0]?.text.value || "",
    attachments:[]
  }));

}

export const uploadAttachment = async (file: Uploadable) => {


      const attachmentId = await openai.files.create({
        file: file,
        purpose: "vision",
      });
      return attachmentId.id
}




export const deleteThread = async (userId: string, threadId: string): Promise<ChatItem[]> => {
  try {
    // First, get the current threads array
    const { data, error: fetchError } = await supabase
      .from('chat_history')
      .select('threads')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!data || !data.threads) {
      return []
    }

    // Check if we're deleting the most recent thread
    const deletingMostRecent = data.threads.some(
      (thread: any) => thread.thread_id === threadId && thread.is_most_recent === true
    );

    // Filter out the thread with the matching ID
    const updatedThreads = data.threads.filter(
      (thread: { thread_id: string }) => thread.thread_id !== threadId
    );

    // If we deleted the most recent thread and there are remaining threads,
    // mark the thread with the most recent last_message_at as the new most recent
    if (deletingMostRecent && updatedThreads.length > 0) {
      // Sort by last_message_at to find the new most recent thread
      const sortedThreads = [...updatedThreads].sort((a: any, b: any) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });
      
      // Mark the first one as most recent
      if (sortedThreads.length > 0) {
        updatedThreads.forEach((thread: any) => {
          if (thread.thread_id === sortedThreads[0].thread_id) {
            thread.is_most_recent = true;
          } else {
            // Make sure no other thread is marked as most recent
            delete thread.is_most_recent;
          }
        });
      }
    }

    // Update the threads array in the database
    const { error: updateError } = await supabase
      .from('chat_history')
      .update({ threads: updatedThreads })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    // Return the updated threads with all required fields
    const now = new Date().toISOString();
    return updatedThreads.map((thread: any) => ({
      thread_id: thread.thread_id,
      name: thread.name,
      restaurant_key: thread.restaurant_key || '',
      created_at: thread.created_at || now,
      last_message_at: thread.last_message_at || thread.created_at || now,
      is_most_recent: thread.is_most_recent || false,
      summary: thread.summary || null
    }))

  } catch (error) {
    console.error('Error deleting thread:', error)
    throw error
  }
}

export const runAssistant = async (
  userId: string | null | undefined,
  userMessage: string,
  attachmentId: string | null,
  threadId: string,
  userName: string | null,
  userEmail: string,
) => {
  // Helper function to recursively filter an object based on a spec.
  // For example, given spec { items: { title: true } },
  // only the "items" field is included, and within that, only "title" for each item.
  function filterObject(obj: any, spec: any): any {
    if (typeof spec !== "object" || spec === null) {
      return obj;
    }
    const filtered: any = {};
    for (const key in spec) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const specValue = spec[key];
        if (typeof specValue === "boolean") {
          if (specValue === true) {
            filtered[key] = obj[key];
          }
        } else if (typeof specValue === "object" && specValue !== null) {
          // If the property is an array, filter each element.
          if (Array.isArray(obj[key])) {
            const filteredArray = obj[key].map((item: any) =>
              filterObject(item, specValue)
            );
            // Check if the filtered array is not "empty"
            // (i.e. it's not an empty array and not an array of empty objects)
            const hasValidItems =
              filteredArray.length > 0 &&
              filteredArray.some(
                (item: any) =>
                  typeof item !== "object" ||
                  item === null ||
                  Object.keys(item).length > 0
              );
            if (hasValidItems) {
              filtered[key] = filteredArray;
            }
          }
          // If it's an object, filter it.
          else if (typeof obj[key] === "object" && obj[key] !== null) {
            const filteredObj = filterObject(obj[key], specValue);
            // Optionally add the object only if it has keys.
            if (Object.keys(filteredObj).length > 0) {
              filtered[key] = filteredObj;
            }
          } else {
            filtered[key] = obj[key];
          }
        }
      }
    }
    return filtered;
  }

  // Helper function to process date flags.
  // For example, "cd" returns the current date,
  // "cd-6months" returns the date six months before the current date,
  // and "cd+7days" returns the date seven days after the current date.
  function processDateFlag(dateStr: string): string {
    if (!dateStr) return "";
    if (dateStr === "cd") {
      return new Date().toISOString();
    }
    // Check for relative date flags of the form: cd+7days, cd-6months, cd+1years, etc.
    const regex = /^cd([+-])(\d+)(days|months|years)$/;
    const match = dateStr.match(regex);
    if (match) {
      const operator = match[1]; // "+" or "-"
      const amount = parseInt(match[2], 10);
      const unit = match[3]; // "days", "months", or "years"
      const date = new Date();
      if (operator === "+") {
        if (unit === "days") {
          date.setDate(date.getDate() + amount);
        } else if (unit === "months") {
          date.setMonth(date.getMonth() + amount);
        } else if (unit === "years") {
          date.setFullYear(date.getFullYear() + amount);
        }
      } else {
        if (unit === "days") {
          date.setDate(date.getDate() - amount);
        } else if (unit === "months") {
          date.setMonth(date.getMonth() - amount);
        } else if (unit === "years") {
          date.setFullYear(date.getFullYear() - amount);
        }
      }
      return date.toISOString();
    }
    // If no flag is detected, assume it's already an ISO date string.
    return dateStr;
  }

  let message;
  console.log("Attachment ID:", attachmentId);
  console.log(`Thread ID: ${threadId}`);

  // Create a new message from the user
  // if (attachmentId) {
  //   message = await openai.beta.threads.messages.create(threadId, {
  //     role: "user",
  //     content: userMessage,
  //     attachments: [{ file_id: attachmentId, tools: [{ type: "file_search" }] }],
  //   });
  // } else {
  //   message = await openai.beta.threads.messages.create(threadId, {
  //     role: "user",
  //     content: userMessage,
  //   });
  // }

  if (attachmentId) {
    message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: [
        { type: "text", text: userMessage },
        { 
          type: "image_file", 
          image_file: { file_id: attachmentId }
        }
      ],
    });
  } else {
    message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage,
    });
  }

  // Start the assistant run and poll for the result
  const run = await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: process.env.ASSISTANT_ID!,
  });

  let messages;

  // If the run completed without any tool call, just retrieve messages
  if (run.status === "completed") {
    messages = await openai.beta.threads.messages.list(run.thread_id);
  }
  // If the run requires a tool output (i.e. a function call), process it
  else if (
    run.status === "requires_action" &&
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    const toolOutputs:any[] = [];
    // Common headers to include in all requests
    for (const tool of run.required_action.submit_tool_outputs.tool_calls) {
      console.log(tool.function.arguments);
      // Process each tool call based on its function name
    
    
    }

    // Submit the tool outputs back to the assistant and poll for a final response
    const toolCallRun = await openai.beta.threads.runs.submitToolOutputsAndPoll(
      threadId,
      run.id,
      {
        tool_outputs: toolOutputs,
      }
    );

    if (toolCallRun.status === "completed") {
      messages = await openai.beta.threads.messages.list(toolCallRun.thread_id);
    } else {
      messages = ["no response"];
    }
  } else {
    messages = ["no response"];
  }

  return { messages: JSON.parse(JSON.stringify(messages)) };
};


// Generate the PDF using pdf-lib


// const deductTokens = async (userId: string, outputCost: number) => {
//   // Fetch the current token balances
//   let { data: user, error: fetchError } = await supabase
//     .from('user_data')
//     .select('characters_used, characters_remaining')
//     .eq('user_id', userId)
//     .single();

//   if (fetchError || !user) {
//     throw new Error(fetchError?.message || 'User not found');
//   }

//   // Calculate new token balances ensuring they don't drop below zero
//   // const updatedInputTokens = Math.max(0, user.charactersUsed -charactersRemaining);
//   const updatedCharactersRemaining = Math.max(0, user.characters_remaining - outputCost);
//   const updatedCharactersUsed = user.characters_used+outputCost

//   // Update the tokens in the database
//   const { error: updateError } = await supabase
//     .from('user_data')
//     .update({
//       // charactersUsed: charactersRemaining,
//       characters_remaining: updatedCharactersRemaining,
//       characters_used: updatedCharactersUsed

//     })
//     .eq('user_id', userId);

//   if (updateError) {
//     throw new Error('Failed to update tokens');
//   }

//   // Return the updated token counts
//   return {
//     updatedCharactersRemaining,
//     updatedCharactersUsed
//   };
// }

// const fetchPdf = async (data:InputData) => {
//   const response = await fetch('http://localhost:3000/api/generate_pdf', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(data),
//   });

//   if (response.ok) {
//     const buffer = await response.arrayBuffer(); // Convert the response to an ArrayBuffer
//     // const uint8Array = new Uint8Array(buffer);  // Convert ArrayBuffer to Uint8Array
//     return buffer

//     // // Handle the Uint8Array, e.g., download the file
//     // const blob = new Blob([uint8Array], { type: 'application/pdf' });
//     // const url = URL.createObjectURL(blob);
//     // const link = document.createElement('a');
//     // link.href = url;
//     // link.download = 'document.pdf';
//     // link.click();
//     // URL.revokeObjectURL(url);
//   } else {
//     console.error('Error fetching PDF');
//   }
// };

// async function generatePDF(data: InputData): Promise<Uint8Array> {
//   const pdfDoc = await PDFDocument.create();
//   const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//   const margin = 50;
//   const lineHeight = 18;

//   const createPage = () => {
//     const page = pdfDoc.addPage();
//     const { width, height } = page.getSize();
//     return { page, width, height, yPosition: height - margin };
//   };

//   let { page, width, height, yPosition } = createPage();
//   const maxWidth = width - 2 * margin;

//   const splitTextIntoLines = (
//     text: string,
//     font: PDFFont,
//     fontSize: number,
//     maxWidth: number
//   ) => {
//     const words = text.split(" ");
//     const lines: string[] = [];
//     let currentLine = words[0];

//     words.slice(1).forEach((word) => {
//       const testLine = `${currentLine} ${word}`;
//       const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
//       if (testLineWidth < maxWidth) {
//         currentLine = testLine;
//       } else {
//         lines.push(currentLine);
//         currentLine = word;
//       }
//     });

//     lines.push(currentLine);
//     return lines;
//   };

//   const addText = (text: string, x: number, fontSize = 12, isBold = false) => {
//     const font = isBold ? helveticaBoldFont : helveticaFont;
//     const lines = splitTextIntoLines(text, font, fontSize, maxWidth);

//     lines.forEach((line, idx) => {
//       if (yPosition - lineHeight < margin) {
//         ({ page, width, height, yPosition } = createPage());
//       }
//       page.drawText(line, {
//         x,
//         y: yPosition - idx * lineHeight,
//         size: fontSize,
//         font,
//         color: rgb(0, 0, 0),
//       });
//     });

//     yPosition -= lines.length * lineHeight;
//   };
//   2;

//   // Add parent and child information
//   addText(`Parent Name: ${data.parent_name}`, margin, 14, true);
//   addText(`Parent Email: ${data.parent_email}`, margin, 14, true);
//   addText(`Child Name: ${data.child_name}`, margin, 14, true);
//   addText(`Child Gender: ${data.child_gender}`, margin, 14, true);
//   addText(`Child Age: ${data.child_age}`, margin, 14, true);
//   yPosition -= 30;

//   // Add category and sub-category details
//   data.categories.forEach((category, index) => {
//     addText(`${index + 1}. ${category.category_name}`, margin, 18, true);
//     yPosition -= lineHeight / 2;

//     category.sub_categories.forEach((subCategory) => {
//       addText(`• ${subCategory.sub_category_name}:`, margin, 14, true);
//       addText(`  ${subCategory.details}`, margin, 12, false);
//       yPosition -= lineHeight / 2;
//     });

//     yPosition -= lineHeight / 2;
//     addText("Possible strategies to solve this problem:", margin, 14, true);
//     yPosition -= lineHeight / 2;

//     category.possible_strategies.forEach((strategy) => {
//       addText(`• ${strategy.title}`, margin, 14, true);
//       addText(`  ${strategy.description}`, margin, 12, false);
//       yPosition -= lineHeight / 2;
//     });

//     yPosition -= 22;
//   });

//   const pdfBytes = await pdfDoc.save();
//   return pdfBytes;
// }



// Upload the PDF to S3



interface SubCategory {
  sub_category_name: string;
  details: string;
}

interface Strategy {
  title: string;
  description: string;
}

interface Category {
  category_name: string;
  sub_categories: SubCategory[];
  possible_strategies: Strategy[];
}

interface InputData {
  parent_name: string;
  parent_email: string;
  child_name: string;
  child_gender: string;
  child_age: number;
  categories: Category[];
}

export const updateThreadActivity = async (userId: string, threadId: string): Promise<ChatItem[]> => {
  try {
    if (!userId || !threadId) {
      console.error("updateThreadActivity: Missing userId or threadId");
      return [];
    }

    console.log(`Updating message activity for thread ${threadId}`);

    // 1. Get the current threads array
    const { data, error: fetchError } = await supabase
      .from('chat_history')
      .select('threads')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error("Error fetching threads for activity update:", fetchError);
      throw fetchError;
    }
    
    if (!data || !data.threads) {
      console.log(`No threads found for user ${userId}`);
      return [];
    }

    // 2. Update all threads - mark the current one as most recent, remove flag from others
    const now = new Date().toISOString();
    let threadFound = false;
    
    const updatedThreads = data.threads.map((thread: any) => {
      if (thread.thread_id === threadId) {
        threadFound = true;
        return { 
          ...thread, 
          last_message_at: now,
          is_most_recent: true, // Set this thread as most recently interacted
          created_at: thread.created_at || now
        };
      }
      // Remove is_most_recent flag from all other threads
      const { is_most_recent, ...restThread } = thread;
      return restThread;
    });

    if (!threadFound) {
      console.log(`Thread ${threadId} not found in user's history, cannot update activity`);
      return data.threads;
    }

    // 3. Update in database
    const { error: updateError } = await supabase
      .from('chat_history')
      .update({ threads: updatedThreads })
      .eq('user_id', userId);

    if (updateError) {
      console.error("Error updating thread activity:", updateError);
      throw updateError;
    }

    console.log(`Successfully updated ${threadId} as most recent thread`);

    // 4. Return the updated threads with proper typing
    return updatedThreads.map((thread: any) => ({
      thread_id: thread.thread_id,
      name: thread.name,
      restaurant_key: thread.restaurant_key || '',
      created_at: thread.created_at || now,
      last_message_at: thread.last_message_at || thread.created_at || now,
      is_most_recent: thread.is_most_recent || false,
      summary: thread.summary || null
    }));

  } catch (error) {
    console.error('Error in updateThreadActivity:', error);
    return [];
  }
};

export const generateAndStoreSummary = async (userId: string, threadId: string): Promise<{success: boolean, error?: string}> => {
  if (!userId || !threadId) {
    console.error("generateAndStoreSummary: Missing userId or threadId");
    return { success: false, error: "Missing required parameters" };
  }

  console.log(`Generating summary for userId: ${userId}, threadId: ${threadId}`);

  try {
    // 1. First check if the user and thread exist and if a recent summary exists
    const { data: historyData, error: fetchError } = await supabase
      .from('chat_history')
      .select('threads')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error("Error fetching chat history before summary generation:", fetchError);
      return { success: false, error: "Failed to fetch chat history" };
    }

    if (!historyData || !historyData.threads) {
      console.log(`No threads found for user ${userId}, skipping summary generation`);
      return { success: false, error: "No threads found" };
    }

    // Find the thread in the user's history
    const targetThread = historyData.threads.find((t: any) => t.thread_id === threadId);
    
    if (!targetThread) {
      console.log(`Thread ${threadId} not found in user ${userId}'s history, skipping summary`);
      return { success: false, error: "Thread not found" };
    }

    // 2. Fetch the conversation messages
    const messages: SimpleMessage[] = await getMessages(threadId);
    
    // Skip if not enough messages (need at least 3 for a meaningful summary)
    if (!messages || messages.length < 3) {
      console.log(`Not enough messages (${messages?.length || 0}) for thread ${threadId}, skipping summary`);
      return { success: false, error: "Not enough messages for summary" };
    }

    // Check if we've recently generated a summary 
    if (targetThread.summary && targetThread.summary_generated_at) {
      const lastSummaryTime = new Date(targetThread.summary_generated_at).getTime();
      
      // Use cooldown period of 1 hour 
      const cooldownPeriod = 3600000; // 1 hour in milliseconds
      const cooldownThreshold = Date.now() - cooldownPeriod;
      
      if (lastSummaryTime > cooldownThreshold) {
        console.log(`Summary for thread ${threadId} was generated recently (${new Date(lastSummaryTime).toLocaleTimeString()}), skipping`);
        return { success: false, error: "Summary generated too recently" };
      }
    }

    // Prepare messages for the summary prompt (limit length if necessary)
    const conversationText = messages
      .map((msg: SimpleMessage) => `${msg.role}: ${msg.content}`)
      .join("\n");
      
    // Limit context length if needed for the summary model
    const contextLimit = 4000; // Adjust based on model limits
    const truncatedConversation = conversationText.length > contextLimit 
      ? "..." + conversationText.slice(-contextLimit) 
      : conversationText;

    // 3. Ask AI to summarize - Improved prompt for better tense and focus
    try {
      const summaryPrompt = `Provide a one-sentence summary in the past tense describing the key topic discussed in this conversation. Example: "The discussion was about Apple's latest product announcements."
\n---\n${truncatedConversation}\n---\nSummary:`;
      
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Or your preferred summary model
        messages: [{ role: "user", content: summaryPrompt }],
        max_tokens: 60, 
        temperature: 0.5,
      });

      const summary = summaryResponse.choices[0]?.message?.content?.trim().replace(/^"|"$/g, '') || null;

      if (!summary) {
        console.log(`AI failed to generate summary for thread ${threadId}`);
        return { success: false, error: "Failed to generate summary text" };
      }
      
      console.log(`Generated summary for thread ${threadId}:`, summary);

      // 4. Update the summary for the specific thread
      const updatedThreads = historyData.threads.map((thread: any) => {
        if (thread.thread_id === threadId) {
          return { 
            ...thread, 
            summary: summary,
            summary_generated_at: new Date().toISOString() 
          };
        }
        return thread;
      });

      // 5. Store the updated history
      const { error: upsertError } = await supabase
        .from('chat_history')
        .upsert({ user_id: userId, threads: updatedThreads });

      if (upsertError) {
        console.error("Error storing updated chat history with summary:", upsertError);
        return { success: false, error: "Failed to store summary" };
      } 
      
      console.log(`Summary stored successfully for thread ${threadId}`);
      return { success: true };
    } catch (openaiError) {
      console.error("Error generating summary with OpenAI:", openaiError);
      return { success: false, error: "Failed to generate summary with AI" };
    }
  } catch (error) {
    console.error(`Error in generateAndStoreSummary for thread ${threadId}:`, error);
    return { success: false, error: "Unexpected error during summary generation" };
  }
};

// Interfaces for user profile data
export interface UserProfile {
  name: string;
  country: string;
  business_name: string;
  business_description: string;
  team_size: string;
  onboarded?: boolean;
}

export interface UserProfileDB extends UserProfile {
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// Function to save user profile information to Supabase
export const saveUserProfile = async (
  userId: string, 
  profileData: UserProfile
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("🟡 saveUserProfile called with userId:", userId);
    console.log("🟡 Profile data to save:", profileData);
    
    if (!userId) {
      console.error("🔴 saveUserProfile: Missing userId");
      return { success: false, error: 'User ID is required' };
    }

    // Check if a profile already exists for this user
    console.log("🟡 Checking for existing profile...");
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      console.error('🔴 Error checking for existing profile:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingProfile) {
      console.log("🟡 Existing profile found:", existingProfile);
    } else {
      console.log("🟡 No existing profile found, will create new");
    }

    const now = new Date().toISOString();
    
    // Prepare the profile data
    const profile: UserProfileDB = {
      user_id: userId,
      ...profileData,
      updated_at: now,
      created_at: existingProfile ? existingProfile.created_at : now
    };

    console.log("🟡 Prepared profile data for upsert:", profile);

    // Upsert the profile data
    console.log("🟡 Sending upsert request to Supabase...");
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(profile);

    if (upsertError) {
      console.error('🔴 Error saving user profile:', upsertError);
      return { success: false, error: upsertError.message };
    }

    console.log("🟢 Profile successfully saved to Supabase");
    return { success: true };
  } catch (error: any) {
    console.error('🔴 Error in saveUserProfile:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

// Function to check if a user has completed onboarding
export const checkUserOnboarded = async (
  userId: string,
  options?: { skipCache?: boolean }
): Promise<{ isOnboarded: boolean; profile: UserProfileDB | null }> => {
  try {
    console.log("🟡 Checking onboarding status for userId:", userId);
    
    if (!userId) {
      console.log("🔴 checkUserOnboarded: Missing userId");
      return { isOnboarded: false, profile: null };
    }

    // Use cache control - add a cache timestamp to avoid excessive DB calls
    // This helps with multiple components using the profile data at once
    const cacheKey = `user_profile_${userId}`;
    if (!options?.skipCache) {
      const cachedData = globalThis.__userProfileCache?.[cacheKey];
      if (cachedData && (Date.now() - cachedData.timestamp < 60000)) { // Cache for 1 minute
        console.log("🟡 Using cached user profile data");
        return {
          isOnboarded: cachedData.isOnboarded,
          profile: cachedData.profile
        };
      }
    }

    // Query the user's profile
    console.log("🟡 Querying user_profiles table...");
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        console.log("🟡 No profile found for user - not onboarded");
        return { isOnboarded: false, profile: null };
      }
      
      console.error('🔴 Error checking onboarding status:', error);
      throw error;
    }

    // If we have a profile and it's marked as onboarded
    const isUserOnboarded = data?.onboarded === true;
    console.log(`🟢 User onboarding check complete. User is ${isUserOnboarded ? 'onboarded' : 'not onboarded'}`);
    if (data) {
      console.log("🟢 Profile data found:", data);
    }
    
    // Cache the result
    if (!globalThis.__userProfileCache) {
      globalThis.__userProfileCache = {};
    }
    
    globalThis.__userProfileCache[cacheKey] = {
      isOnboarded: isUserOnboarded,
      profile: data as UserProfileDB,
      timestamp: Date.now()
    };
    
    return { 
      isOnboarded: isUserOnboarded, 
      profile: data as UserProfileDB 
    };
  } catch (error: any) {
    console.error('🔴 Error in checkUserOnboarded:', error);
    return { isOnboarded: false, profile: null };
  }
};

// Add TypeScript declaration for the cache
declare global {
  var __userProfileCache: {
    [key: string]: {
      isOnboarded: boolean;
      profile: UserProfileDB | null;
      timestamp: number;
    }
  } | undefined;
}

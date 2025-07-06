import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Define TypeScript interfaces
interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface WebSearchResults {
  query: string;
  originalQuery?: string;
  enhancedQuery?: string;
  answer?: string;
  isFinancialQuery?: boolean;
  searchTimestamp?: string;
  results: WebSearchResult[];
}

interface ChatRequestBody {
  prompt: string;
  threadId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string;
  attachmentIds?: string[];
  webSearchResults?: WebSearchResults | null;
}

// Message tracking functionality removed as it's not needed

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ChatRequestBody;
    const { prompt, threadId, attachmentIds, webSearchResults } = body;

    // Validate required fields
    if (!prompt || !threadId) {
      return NextResponse.json(
        { 
          error: "Prompt and threadId are required" 
        },
        {
          status: 400,
        }
      );
    }

    // Create a streaming response using standard Web API
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder(); // Encoder for streaming data

        try {
          // Keep the original user message unchanged
          const messageContent = prompt;
          
          // Prepare additional instructions with web search results if available
          let additionalInstructions = "";
          
          if (webSearchResults && webSearchResults.results.length > 0) {
            additionalInstructions = `ADDITIONAL CONTEXT FROM WEB SEARCH:\n\n`;
            additionalInstructions += `Search Query: "${webSearchResults.query}"\n`;
            
            // Add enhanced search context for financial queries
            if (webSearchResults.isFinancialQuery) {
              additionalInstructions += `Search Type: Financial/Real-time Data Query\n`;
              additionalInstructions += `Search Timestamp: ${webSearchResults.searchTimestamp || 'Not available'}\n`;
              additionalInstructions += `Enhanced Query: "${webSearchResults.enhancedQuery || webSearchResults.query}"\n`;
            }
            additionalInstructions += `\n`;
            
            if (webSearchResults.answer) {
              additionalInstructions += `Quick Answer: ${webSearchResults.answer}\n\n`;
            }
            
            additionalInstructions += `Relevant Web Results:\n`;
            webSearchResults.results.forEach((result, index) => {
              additionalInstructions += `${index + 1}. ${result.title}\n`;
              additionalInstructions += `   Source: ${result.url}\n`;
              additionalInstructions += `   Content: ${result.content}\n\n`;
            });
            
            // Enhanced instructions for financial data
            if (webSearchResults.isFinancialQuery) {
              additionalInstructions += `IMPORTANT: This is a financial data query. Please prioritize the most recent and accurate information from reputable financial sources. Always mention the timestamp/date of the data and note that financial information changes rapidly. If there are discrepancies between sources, mention them and explain which source appears most reliable.`;
            } else {
              additionalInstructions += `Please use this web search information to enhance your response with the most recent and accurate information. Cite the source when appropriate. Integrate this information naturally with your existing knowledge.`;
            }
          }
          // console.log(additionalInstructions);
          // Create a message with or without attachments
          if (attachmentIds && attachmentIds.length > 0) {
            // With attachments - create content array with text and all image files
            await openai.beta.threads.messages.create(threadId, {
              role: "user",
              content: [
                { type: "text", text: messageContent },
                ...attachmentIds.map(id => ({ 
                  type: "image_file" as const, 
                  image_file: { file_id: id } 
                }))
              ]
            });
          } else {
            // Without attachments
            await openai.beta.threads.messages.create(threadId, {
              role: "user",
              content: messageContent,
            });
          }
          const currentTime = new Date().toISOString();
          
          additionalInstructions =  additionalInstructions + `In case you need to use it REMEMBER TODAY's DATE AND TIME IS ${currentTime}`
          // Start a run with the assistant and enable streaming
          const runStream = openai.beta.threads.runs.stream( // Use .stream() instead of .create()
            threadId,
            {
              assistant_id: process.env.ASSISTANT_ID!,
              additional_instructions: additionalInstructions
              // No need to explicitly set stream: true with .stream()
            }
          );

          // Process the stream events
          for await (const event of runStream) {
            // Handle text deltas
            if (event.event === "thread.message.delta") {
              const delta = event.data.delta;
              // Check if content exists and the first item is text
              if (delta.content && delta.content[0]?.type === "text" && delta.content[0].text) {
                const textValue = delta.content[0].text.value;
                if (textValue) {
                  // Enqueue the chunk of text as it arrives
                  controller.enqueue(encoder.encode(textValue));
                }
              }
            }
            
            // Handle run steps if needed (e.g., for logging or specific UI updates)
            else if (event.event === "thread.run.step.created") {
              console.log("Run step created:", event.data.id);
            } else if (event.event === "thread.run.step.delta") {
               // Can provide finer-grained progress updates here if desired
            }

            // Handle tool calls if required
            else if (event.event === "thread.run.requires_action") {
              const run = event.data;
              if (run.status === "requires_action" && 
                  run.required_action?.type === "submit_tool_outputs" &&
                  run.required_action.submit_tool_outputs.tool_calls) {

                const toolOutputs: Array<{ tool_call_id: string; output: string }> = [];
                
                // Process each tool call (simple example)
                for (const toolCall of run.required_action.submit_tool_outputs.tool_calls) {
                  console.log(`Handling tool call: ${toolCall.function.name}`);
                  // Add logic to execute tools and get results
                  // For now, just providing a placeholder
                  toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify({ result: `Tool ${toolCall.function.name} executed (placeholder)` })
                  });
                }

                // Submit tool outputs back and continue streaming
                if (toolOutputs.length > 0) {
                  const toolOutputStream = openai.beta.threads.runs.submitToolOutputsStream(
                    threadId,
                    run.id,
                    { tool_outputs: toolOutputs }
                  );
                  // Continue processing the stream after submitting tool outputs
                  for await (const toolEvent of toolOutputStream) {
                     if (toolEvent.event === "thread.message.delta") {
                      const delta = toolEvent.data.delta;
                      // Check if content exists and the first item is text
                      if (delta.content && delta.content[0]?.type === "text" && delta.content[0].text) {
                        const textValue = delta.content[0].text.value;
                        if (textValue) {
                          controller.enqueue(encoder.encode(textValue));
                        }
                      }
                    }
                     // Handle other events from the tool output stream if necessary
                  }
                }
              }
            }

            // Handle completion or errors
            else if (event.event === "thread.run.completed") {
              console.log("Run completed successfully.");
              // Message counting functionality removed as it's not needed
              // No need to enqueue anything here, already streamed deltas
            } else if (event.event === "thread.run.failed") {
              console.error("Run failed:", event.data.last_error);
              controller.enqueue(encoder.encode(`\nError: Run failed - ${event.data.last_error?.message || "Unknown error"}`));
              break; // Stop streaming on failure
            }
          }

          // Close the stream once the run is fully processed
          controller.close();

        } catch (error) {
          console.error("Error processing OpenAI stream:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown stream error";
          try {
             controller.enqueue(encoder.encode(`\nError: ${errorMessage}`));
          } catch (e) {
             console.error("Error enqueuing final error message:", e);
          }
          // Ensure the controller is closed even if enqueue fails
          try {
             controller.close();
          } catch (e) {
             console.error("Error closing controller after error:", e);
          }
        }
      }
    });

    // Return the response as a stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Ensure correct content type for frontend
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive', // Optional: Helps maintain connection for streaming
      },
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    const errorStatus = error instanceof Error && 'status' in error ? 
      (error as Error & { status: number }).status : 500;
    return NextResponse.json(
      { error: errorMessage },
      {
        status: errorStatus,
      }
    );
  }
} 
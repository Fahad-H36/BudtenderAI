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
  webSearchEnabled?: boolean;
}

import { tavily } from "@tavily/core";
import { isFinancialQuery, enhanceFinancialQuery } from "@/lib/web-search-helpers";

// Initialize Tavily client
const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY || "",
});

// Web search function for the assistant to call
async function performWebSearch(query: string): Promise<WebSearchResults> {
  try {
    // Enhance query for financial data
    const enhancedQuery = enhanceFinancialQuery(query);
    console.log("Original query from assistant:", query);
    console.log("Enhanced query for search:", enhancedQuery);

    // For financial queries, use more specific search parameters
    const isFinancial = isFinancialQuery(query);
    const searchConfig = {
      searchDepth: "advanced" as const,
      maxResults: isFinancial ? 8 : 5,
      includeAnswer: true,
      includeRawContent: false as const,
      includeImages: false,
      includeDomains: isFinancial ? [
        "finance.yahoo.com",
        "www.google.com/finance",
        "marketwatch.com",
        "bloomberg.com",
        "reuters.com",
        "cnbc.com",
        "investing.com",
        "nasdaq.com"
      ] : undefined,
    };

    // Perform web search
    const searchResult = await tavilyClient.search(enhancedQuery, searchConfig);

    // For financial queries, try to validate and clean the results
    let processedResults = searchResult.results;
    
    if (isFinancial) {
      // Filter out results that seem outdated or unreliable for financial data
      processedResults = searchResult.results.filter(result => {
        const content = result.content.toLowerCase();
        const currentYear = new Date().getFullYear();
        
        // Filter out results with future dates or very old dates
        const hasRecentDate = content.includes(currentYear.toString()) || 
                             content.includes((currentYear - 1).toString());
        
        return hasRecentDate;
      });

      // If we filtered out too many results, fall back to original results
      if (processedResults.length < 2 && searchResult.results.length > 2) {
        console.warn("Financial data filtering removed too many results, using original results");
        processedResults = searchResult.results;
      }
    }

    // Format the response
    const formattedResults: WebSearchResults = {
      query: searchResult.query,
      originalQuery: query,
      enhancedQuery: enhancedQuery,
      answer: searchResult.answer,
      isFinancialQuery: isFinancial,
      searchTimestamp: new Date().toISOString(),
      results: processedResults.map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
      })),
    };

    return formattedResults;
  } catch (error) {
    console.error("Error performing web search:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ChatRequestBody;
    const { prompt, threadId, attachmentIds, webSearchEnabled = false } = body;

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
        const encoder = new TextEncoder();

        try {
          // Create the message content
          const messageContent = prompt;
          
          // Create message with or without attachments
          if (attachmentIds && attachmentIds.length > 0) {
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
            await openai.beta.threads.messages.create(threadId, {
              role: "user",
              content: messageContent,
            });
          }

          // Define the web search tool
          const tools = webSearchEnabled ? [
            {
              type: "function" as const,
              function: {
                name: "web_search",
                description: "Search the web for current information. Use this when you need up-to-date information about stock prices, financial data, current events, or any information that requires real-time data. Always generate a refined search query based on the conversation context.",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query. For follow-up questions, include relevant context from the conversation. For financial queries, be specific and include company names, ticker symbols, and what information is needed (e.g., 'Tesla TSLA current stock price', 'Pfizer PFE stock price today')."
                    }
                  },
                  required: ["query"]
                }
              }
            }
          ] : undefined;
          const currentTime = new Date().toISOString();
          console.log("currentTime", currentTime);
          // Start a run with the assistant
          const runStream = openai.beta.threads.runs.stream(
            threadId,
            {
              assistant_id: process.env.ASSISTANT_ID!,
              tools: tools,
              tool_choice: webSearchEnabled ? "auto" : undefined,
              additional_instructions: `In case you need to use it REMEMBER TODAY's DATE AND TIME IS ${currentTime}`
            }
          );

          // Track if we've sent any content
          let hasStartedStreaming = false;

          // Process the stream events
          for await (const event of runStream) {
            // Handle text deltas
            if (event.event === "thread.message.delta") {
              const delta = event.data.delta;
              if (delta.content && delta.content[0]?.type === "text" && delta.content[0].text) {
                const textValue = delta.content[0].text.value;
                if (textValue) {
                  hasStartedStreaming = true;
                  controller.enqueue(encoder.encode(textValue));
                }
              }
            }
            
            // Handle tool calls (web search)
            else if (event.event === "thread.run.requires_action") {
              const run = event.data;
              if (run.status === "requires_action" && 
                  run.required_action?.type === "submit_tool_outputs" &&
                  run.required_action.submit_tool_outputs.tool_calls) {

                const toolOutputs: Array<{ tool_call_id: string; output: string }> = [];
                
                // Process each tool call
                for (const toolCall of run.required_action.submit_tool_outputs.tool_calls) {
                  if (toolCall.function.name === "web_search") {
                    try {
                      const args = JSON.parse(toolCall.function.arguments);
                      console.log("Assistant generated search query:", args.query);
                      
                      // Perform web search with the assistant's refined query
                      const searchResults = await performWebSearch(args.query);
                      
                      // Format results for the assistant
                      let formattedResults = `Web search results for "${args.query}":\n\n`;
                      
                      if (searchResults.answer) {
                        formattedResults += `Quick Answer: ${searchResults.answer}\n\n`;
                      }
                      
                      if (searchResults.isFinancialQuery) {
                        formattedResults += `Note: This is financial data searched at ${searchResults.searchTimestamp}\n\n`;
                      }
                      
                      searchResults.results.forEach((result, index) => {
                        formattedResults += `${index + 1}. ${result.title}\n`;
                        formattedResults += `   Source: ${result.url}\n`;
                        formattedResults += `   ${result.content}\n\n`;
                      });
                      
                      toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: formattedResults
                      });
                    } catch (error) {
                      console.error("Error in web search:", error);
                      toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`
                      });
                    }
                  }
                }

                // Submit tool outputs and continue streaming
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
                      if (delta.content && delta.content[0]?.type === "text" && delta.content[0].text) {
                        const textValue = delta.content[0].text.value;
                        if (textValue) {
                          hasStartedStreaming = true;
                          controller.enqueue(encoder.encode(textValue));
                        }
                      }
                    }
                  }
                }
              }
            }

            // Handle completion
            else if (event.event === "thread.run.completed") {
              console.log("Run completed successfully.");
            } else if (event.event === "thread.run.failed") {
              console.error("Run failed:", event.data.last_error);
              if (!hasStartedStreaming) {
                controller.enqueue(encoder.encode(`Error: ${event.data.last_error?.message || "Unknown error"}`));
              }
            }
          }

          // Close the stream
          controller.close();

        } catch (error) {
          console.error("Error processing OpenAI stream:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown stream error";
          try {
            controller.enqueue(encoder.encode(`Error: ${errorMessage}`));
          } catch (e) {
            console.error("Error enqueuing error message:", e);
          }
          try {
            controller.close();
          } catch (e) {
            console.error("Error closing controller:", e);
          }
        }
      }
    });

    // Return the response as a stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
      }
    );
  }
} 
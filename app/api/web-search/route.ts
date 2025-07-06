import { NextRequest, NextResponse } from "next/server";
import { tavily } from "@tavily/core";
import { isFinancialQuery, enhanceFinancialQuery } from "@/lib/web-search-helpers";

// Initialize Tavily client
const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY || "",
});

interface WebSearchRequestBody {
  query: string;
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
}

interface TavilySearchConfig {
  searchDepth: "basic" | "advanced";
  maxResults: number;
  includeAnswer: boolean;
  includeRawContent: false | "markdown" | "text";
  includeImages: boolean;
  includeDomains?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WebSearchRequestBody;
    const { query, searchDepth = "basic", maxResults = 5 } = body;

    // Validate required fields
    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.TAVILY_API_KEY) {
      console.error("TAVILY_API_KEY is not configured");
      return NextResponse.json(
        { error: "Web search service is not configured" },
        { status: 500 }
      );
    }

    // Enhance query for financial data
    const enhancedQuery = enhanceFinancialQuery(query);
    console.log("Original query:", query);
    console.log("Enhanced query:", enhancedQuery);

    // For financial queries, use more specific search parameters
    const isFinancial = isFinancialQuery(query);
    const searchConfig: TavilySearchConfig = {
      searchDepth: isFinancial ? "advanced" : searchDepth,
      maxResults: isFinancial ? Math.max(maxResults, 8) : maxResults, // More results for financial data
      includeAnswer: true,
      includeRawContent: false as const,
      includeImages: false,
    };

    // Add financial-specific domains for better accuracy
    if (isFinancial) {
      searchConfig.includeDomains = [
        "finance.yahoo.com",
        "www.google.com/finance",
        "marketwatch.com",
        "bloomberg.com",
        "reuters.com",
        "cnbc.com",
        "investing.com",
        "nasdaq.com"
      ];
    }

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
        
        // Filter out obviously wrong price information (like $1000+ for stocks that shouldn't be that high)
        const hasReasonablePrice = !content.includes('$1,000') && !content.includes('$1000');
        
        return hasRecentDate && hasReasonablePrice;
      });

      // If we filtered out too many results, fall back to original results but log the issue
      if (processedResults.length < 2 && searchResult.results.length > 2) {
        console.warn("Financial data filtering removed too many results, using original results");
        processedResults = searchResult.results;
      }
    }

    // Format the response
    const formattedResults = {
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

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error in web search API route:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during web search";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
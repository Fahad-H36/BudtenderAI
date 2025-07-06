// Helper function to detect financial queries with comprehensive analysis
export function isFinancialQuery(query: string): boolean {
  console.log("Checking if query is financial:", query);
  const lowerQuery = query.toLowerCase();
  
  // 1. Stock ticker patterns (3-5 uppercase letters, often with $ prefix)
  const tickerPatterns = [
    /\b[A-Z]{1,5}\b\s*(stock|share|price|quote)/i,  // TSLA stock, AAPL price
    /\$[A-Z]{1,5}\b/i,                               // $TSLA, $AAPL
    /\b(ticker|symbol)\s*:?\s*[A-Z]{1,5}\b/i,       // ticker: TSLA, symbol AAPL
    /\b[A-Z]{1,5}\/[A-Z]{1,5}\b/i                   // BTC/USD, EUR/USD
  ];
  
  // 2. Financial keywords and phrases
  const financialKeywords = [
    // Price-related
    'stock price', 'share price', 'stock quote', 'market price', 'trading price',
    'current price', 'live price', 'real-time price', 'today\'s price',
    'closing price', 'opening price', 'pre-market', 'after-hours',
    
    // Market terms
    'NYSE', 'NASDAQ', 'stock market', 'stock exchange', 'ticker',
    'market cap', 'market capitalization', 'valuation',
    
    // Financial metrics
    'P/E ratio', 'price to earnings', 'EPS', 'earnings per share',
    'dividend yield', 'beta', 'volume', 'market volume',
    'revenue', 'quarterly earnings', 'annual report',
    
    // Investment terms
    'buy rating', 'sell rating', 'analyst rating', 'price target',
    'support level', 'resistance level', 'technical analysis',
    'fundamental analysis', 'bull market', 'bear market',
    
    // Crypto
    'bitcoin price', 'ethereum price', 'crypto price', 'cryptocurrency',
    'BTC', 'ETH', 'blockchain', 'defi',
    
    // Forex
    'exchange rate', 'currency rate', 'forex', 'FX rate',
    
    // Commodities
    'gold price', 'oil price', 'commodity price', 'futures price'
  ];
  
  // 3. Financial question patterns
  const questionPatterns = [
    /what.*price.*of/i,                    // "What is the price of Tesla"
    /how.*much.*cost/i,                    // "How much does TSLA cost"
    /what.*worth/i,                        // "What is Apple worth"
    /how.*performing/i,                    // "How is the stock performing"
    /what.*trading.*at/i,                  // "What is it trading at"
    /current.*value/i,                     // "current value of"
    /market.*value/i,                      // "market value of"
    /share.*worth/i,                       // "share worth"
    /stock.*doing/i                        // "how is the stock doing"
  ];
  
  // 4. Company names commonly searched for financial data
  const financialCompanies = [
    'tesla', 'apple', 'microsoft', 'google', 'amazon', 'meta', 'netflix',
    'nvidia', 'amd', 'intel', 'boeing', 'coca cola', 'disney', 'walmart',
    'berkshire hathaway', 'jpmorgan', 'bank of america', 'goldman sachs',
    'visa', 'mastercard', 'paypal', 'salesforce', 'adobe', 'oracle',
    'bitcoin', 'ethereum', 'dogecoin', 'cardano', 'solana'
  ];
  
  // 5. Price/currency patterns
  const pricePatterns = [
    /\$[\d,]+\.?\d*/,                      // $340.47, $1,234
    /[\d,]+\.?\d*\s*(dollars?|USD|cents?)/i, // 340 dollars, 123 USD
    /price.*[\d,]+/i,                      // price 340
    /worth.*[\d,]+/i,                      // worth 1000
    /trading.*[\d,]+/i                     // trading at 340
  ];
  
  // Check ticker patterns
  if (tickerPatterns.some(pattern => pattern.test(query))) {
    return true;
  }
  
  // Check financial keywords
  if (financialKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return true;
  }
  
  // Check question patterns
  if (questionPatterns.some(pattern => pattern.test(query))) {
    return true;
  }
  
  // Check if query contains company name + financial context
  const hasCompany = financialCompanies.some(company => lowerQuery.includes(company));
  const hasFinancialContext = [
    'price', 'stock', 'share', 'value', 'worth', 'cost', 'trading',
    'market', 'investment', 'buy', 'sell', 'rate', 'performance'
  ].some(term => lowerQuery.includes(term));
  
  if (hasCompany && hasFinancialContext) {
    return true;
  }
  
  // Check price patterns
  if (pricePatterns.some(pattern => pattern.test(query))) {
    return true;
  }
  
  return false;
}

// Helper function to enhance financial queries with smart context
export function enhanceFinancialQuery(query: string): string {
  if (!isFinancialQuery(query)) {
    return query;
  }
  
  const lowerQuery = query.toLowerCase();
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const currentYear = new Date().getFullYear();
  
  // Detect specific financial query types and enhance accordingly
  let enhancement = '';
  
  // Stock price queries
  if (lowerQuery.includes('stock') || lowerQuery.includes('share') || /\$[A-Z]{1,5}\b/.test(query)) {
    enhancement = `real-time stock price current market data ${currentDate} live trading`;
  }
  // Crypto queries
  else if (lowerQuery.includes('bitcoin') || lowerQuery.includes('crypto') || lowerQuery.includes('ethereum')) {
    enhancement = `current price ${currentDate} real-time cryptocurrency market data live`;
  }
  // Forex/currency queries
  else if (lowerQuery.includes('exchange rate') || lowerQuery.includes('currency') || lowerQuery.includes('forex')) {
    enhancement = `current exchange rate ${currentDate} real-time forex market data`;
  }
  // Company valuation queries
  else if (lowerQuery.includes('market cap') || lowerQuery.includes('valuation') || lowerQuery.includes('worth')) {
    enhancement = `current market capitalization ${currentDate} real-time valuation data`;
  }
  // Performance/analysis queries
  else if (lowerQuery.includes('performing') || lowerQuery.includes('analysis') || lowerQuery.includes('rating')) {
    enhancement = `latest performance analysis ${currentYear} current financial metrics`;
  }
  // General financial queries
  else {
    enhancement = `real-time current price today ${currentDate} live market data`;
  }
  
  // Add year context for better temporal relevance
  enhancement += ` ${currentYear}`;
  
  return `${query} ${enhancement}`;
} 
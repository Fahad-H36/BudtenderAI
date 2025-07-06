# Finance Chatbot

A finance-focused AI chatbot that helps users ask questions about finance topics and get expert-like answers.

## Features

- Authentication with Clerk
- Persistent chat history
- Thread-based conversation management
- Responsive design with sidebar navigation
- Admin dashboard for monitoring and management
- **Web Search Integration** - Toggle web search to enhance responses with real-time information

## Tech Stack

- Next.js + React
- Tailwind CSS
- Clerk Authentication
- Supabase for database
- OpenAI API for AI responses
- Tavily API for web search capabilities

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
ASSISTANT_ID=your_openai_assistant_id

# Tavily (for web search)
TAVILY_API_KEY=your_tavily_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Web Search Feature

The chatbot includes an optional web search feature powered by Tavily API. When enabled, the chatbot will search the web for relevant information to enhance its responses.

### How to use:
1. Toggle the "Search the web" switch in the chat interface
2. Type your question and send it
3. The chatbot will perform a web search and include relevant results in its response

### Setting up Tavily:
1. Sign up for a Tavily API account at [tavily.com](https://tavily.com)
2. Get your API key from the dashboard
3. Add `TAVILY_API_KEY=your_api_key` to your `.env.local` file

## License

MIT

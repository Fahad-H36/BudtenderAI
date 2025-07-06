"use client";

import { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of our message type
export interface Message {
  role: "assistant" | "user";
  content: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url?: string;
  }>;
  status?: "success" | "error";
  id?: string;
}

// Define our context type
interface ChatContextState {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  creatingThread: boolean;
  setCreatingThread: React.Dispatch<React.SetStateAction<boolean>>;
  chatStarted: boolean;
  setChatStarted: React.Dispatch<React.SetStateAction<boolean>>;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
}

// Create the context
const ChatStateContext = createContext<ChatContextState | undefined>(undefined);

// Create a custom hook to use the context
export function useChatState() {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error('useChatState must be used within a ChatContextProvider');
  }
  return context;
}

// Create the provider component
export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [creatingThread, setCreatingThread] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [prompt, setPrompt] = useState("");

  const value = {
    messages,
    setMessages,
    creatingThread,
    setCreatingThread,
    chatStarted,
    setChatStarted,
    prompt,
    setPrompt
  };

  return (
    <ChatStateContext.Provider value={value}>
      {children}
    </ChatStateContext.Provider>
  );
} 
"use client";

import { getUserChats } from '@/utils/actions';
import { useAuth } from '@clerk/nextjs';
import { createContext, useEffect, useState, ReactNode } from 'react';

// Define types for our chat data structures
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatItem {
    thread_id: string;
    name: string;
  }

// Define the shape of our context
type ChatContextType = {
  currentThread: string | null;
  setCurrentThread: (thread: string ) => void;
  restaurantKey: string;
  setRestaurantKey: (restaurant: string) => void;
  currentThreadMessageList: Message[];
  setCurrentThreadMessageList: (messages: Message[]) => void;
  chatList: ChatItem[];
  setChatList: (chats: ChatItem[]) => void;
  intro: string;
  setIntro: (introMsg: string) => void,
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

// Create the context
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Create a provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentThread, setCurrentThread] = useState<string | null>(null);
  const [currentThreadMessageList, setCurrentThreadMessageList] = useState<Message[]>([]);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [restaurantKey, setRestaurantKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [intro, setIntro] = useState("1st");
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      try {
        const fetchUserChats = async () => {
          const chats = await getUserChats(userId);
          setChatList(chats.reverse());
          setIsLoading(false);
      }
        fetchUserChats();
      } catch (error) {
        console.error("Error fetching user chats:", error);
        setIsLoading(false);
      }
    }
  }, [userId, setChatList]);

  return (
    <ChatContext.Provider
      value={{
        currentThread,
        setCurrentThread,
        currentThreadMessageList,
        setCurrentThreadMessageList,
        restaurantKey,
        setRestaurantKey,
        isLoading,
        setIsLoading,
        chatList,
        setChatList,
        intro,
        setIntro
     }}
    >
      {children}
    </ChatContext.Provider>
  );
};
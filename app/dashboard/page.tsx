"use client";

import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { useEffect, useState, useContext } from "react";
import { ChatContext } from "@/app/contexts/ChatContext";
import { getMessages } from "@/utils/actions";
import { Message } from "@/app/contexts/ChatContextProvider";
import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get chat context for the current thread
  const chatContext = useContext(ChatContext);
  const currentThread = chatContext?.currentThread;

  // Ensure user exists in database when they load the dashboard
  useEffect(() => {
    const ensureUserExists = async () => {
      if (isClerkLoaded && user?.id && user?.primaryEmailAddress?.emailAddress) {
        try {
          console.log("Ensuring user exists in database:", user.id);
          
          const response = await fetch('/api/ensure-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail: user.primaryEmailAddress.emailAddress
            })
          });

          const result = await response.json();
          
          if (result.success) {
            if (result.created) {
              console.log("✅ User created in database");
            } else {
              console.log("✅ User already exists in database");
            }
          } else {
            console.error("❌ Failed to ensure user exists:", result.error);
          }
        } catch (error) {
          console.error("❌ Error ensuring user exists:", error);
        }
      }
    };

    ensureUserExists();
  }, [isClerkLoaded, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Fetch messages when thread changes
  useEffect(() => {
    if (currentThread) {
      setLoading(true);
      console.log("Fetching messages for thread:", currentThread);  
      const fetchMessages = async () => {
        try {
          const fetchedMessages = await getMessages(currentThread);
          setMessages(fetchedMessages.reverse());
        } catch (error) {
          console.error("Error fetching messages:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchMessages();
    } else {
      // Clear messages when no thread is selected
      setMessages([]);
    }
  }, [currentThread]);

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      <ChatInterface
        messages={messages}
        setMessages={setMessages}
        loading={loading}
      />
    </div>
  );
} 
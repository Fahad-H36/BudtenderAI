"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Minimize2,
  Maximize2,
  Loader2,
  Bot
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LandingPageChatbotProps {
  onSignUpClick?: () => void;
}

export function LandingPageChatbot({ onSignUpClick }: LandingPageChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Create a thread for guest users
  const createGuestThread = async () => {
    try {
      const response = await fetch('/api/guest-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.threadId) {
          setThreadId(data.threadId);
          return data.threadId;
        }
      }
    } catch (error) {
      console.error('Error creating guest thread:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create thread if needed
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createGuestThread();
        if (!currentThreadId) {
          throw new Error('Failed to create guest session');
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageContent,
          threadId: currentThreadId,
          userId: null,
          userName: 'Guest'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantResponse += chunk;

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: assistantResponse }
              : msg
          )
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or sign up for a better experience!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m your AI Budtender — your friendly cannabis shopping assistant. Whether you\'re looking to sleep better, relieve stress, or just chill, I\'ll help you find the perfect products.\n\nBy using this chatbot, you agree to our Terms and Conditions. What are you looking for today? 🌿',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
             {/* Chat Button */}
       <AnimatePresence>
         {!isOpen && (
           <motion.button
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0, opacity: 0 }}
             onClick={openChat}
             className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-6 py-3"
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             style={{ 
               position: 'fixed',
               bottom: '24px',
               right: '24px',
               zIndex: 1000
             }}
           >
             <span className="text-white font-semibold text-sm whitespace-nowrap group-hover:scale-105 transition-transform">
               Ask Budtender
             </span>
             {/* Pulse animation */}
             <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
           </motion.button>
         )}
       </AnimatePresence>

             {/* Chat Window */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className={`chat-window bg-white rounded-2xl shadow-2xl border border-emerald-100 transition-all duration-300 ${
               isMinimized ? 'w-80 h-16' : 'w-96 h-[500px] md:w-96 md:h-[500px]'
             }`}
             style={{ 
               maxHeight: isMinimized ? '64px' : 'min(90vh, 600px)',
               minHeight: isMinimized ? '64px' : '400px',
               width: isMinimized ? 'min(320px, calc(100vw - 48px))' : 'min(384px, calc(100vw - 48px))'
             }}
           >
             {/* Header - Always visible */}
             <div className="chat-header bg-gradient-to-r from-emerald-500 to-green-600 p-3 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
               <div className="flex items-center space-x-2 min-w-0 flex-1">
                 <div className="min-w-0 flex-1">
                   <h3 className="text-white font-semibold text-sm truncate">BudtenderAI</h3>
                   {!isMinimized && (
                     <p className="text-emerald-100 text-xs truncate">Ask me anything!</p>
                   )}
                 </div>
               </div>
               <div className="flex items-center space-x-1 flex-shrink-0">
                 <button
                   onClick={toggleMinimize}
                   className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                   title={isMinimized ? "Expand chat" : "Minimize chat"}
                 >
                   {isMinimized ? (
                     <Maximize2 className="h-4 w-4 text-white" />
                   ) : (
                     <Minimize2 className="h-4 w-4 text-white" />
                   )}
                 </button>
                 <button
                   onClick={closeChat}
                   className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                   title="Close chat"
                 >
                   <X className="h-4 w-4 text-white" />
                 </button>
               </div>
             </div>

             {/* Chat Content - Only visible when not minimized */}
             {!isMinimized && (
               <div className="flex flex-col" style={{ height: 'calc(100% - 56px)' }}>
                 {/* Messages Area */}
                 <div 
                   className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
                   style={{ 
                     minHeight: '200px',
                     maxHeight: 'calc(100% - 80px)' // Leave space for input
                   }}
                 >
                                     {messages.map((message, index) => (
                     <motion.div
                       key={message.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.1 }}
                       className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                     >
                       <div
                         className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                           message.role === 'user'
                             ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                             : 'bg-gray-100 text-gray-800'
                         }`}
                       >
                         <div className="flex items-start space-x-2">
                           {message.role === 'assistant' && (
                             <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                               <Bot className="h-3 w-3 text-white" />
                             </div>
                           )}
                           <div className="flex-1">
                             <p className="text-sm leading-relaxed">{message.content}</p>
                             <span className={`text-xs mt-1 block ${
                               message.role === 'user' ? 'text-emerald-100' : 'text-gray-500'
                             }`}>
                               {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           </div>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                   
                   {isLoading && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="flex justify-start"
                     >
                       <div className="bg-gray-100 rounded-2xl px-3 py-2 flex items-center space-x-2">
                         <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                           <Bot className="h-3 w-3 text-white" />
                         </div>
                         <div className="flex space-x-1">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                         </div>
                       </div>
                     </motion.div>
                   )}
                   
                   <div ref={messagesEndRef} />
                 </div>

                                  {/* Input Area */}
                 <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0 rounded-b-2xl">
                   <div className="flex space-x-2">
                     <input
                       ref={inputRef}
                       type="text"
                       value={inputValue}
                       onChange={(e) => setInputValue(e.target.value)}
                       onKeyPress={handleKeyPress}
                       placeholder="Ask Budtender"
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                       disabled={isLoading}
                     />
                     <button
                       onClick={handleSendMessage}
                       disabled={isLoading || !inputValue.trim()}
                       className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                     >
                       {isLoading ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <Send className="h-4 w-4" />
                       )}
                     </button>
                   </div>
                   
                   {/* Sign up prompt */}
                   <div className="mt-2 text-center">
                     <p className="text-xs text-gray-500 mb-1">
                       Want the full experience?{' '}
                       <button
                         onClick={onSignUpClick}
                         className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                       >
                         Sign up for free
                       </button>
                     </p>
                     <p className="text-xs text-gray-400">
                       By using this chatbot, you agree to our{' '}
                       <a 
                         href="/terms" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-emerald-600 hover:text-emerald-700 underline"
                       >
                         Terms and Conditions
                       </a>
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 
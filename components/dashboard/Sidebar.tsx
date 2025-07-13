"use client";

import { useState, useEffect, useContext } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageCircle,
  Plus,
  Trash2,
  X,
  User,
  Loader2,
} from "lucide-react";
import { useUser, useAuth, SignOutButton } from "@clerk/nextjs";
import { ChatContext } from "@/app/contexts/ChatContext";
import { createThread, getMessages, deleteThread} from "@/utils/actions";
import { motion, AnimatePresence } from "framer-motion";
import { useChatState } from "@/app/contexts/ChatContextProvider";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/modal";
import { isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { usePathname } from "next/navigation";
import ChatListSkeleton from "./ChatListSkeleton";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  }
};

const chatItemVariants = {
  hidden: { opacity: 0, x: -5, scale: 0.98 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30 
    }
  }
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  }
};

interface ChatItem {
  thread_id: string;
  name: string;
  created_at?: string;
  last_message_at?: string;
  summary?: string | null;
}

// Define the type for navigation items
interface NavigationItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href: string;
}

const navigationItems: NavigationItem[] = [
  // { id: 'home', icon: Home, label: 'Home', href: '/dashboard' },
  // No settings item
];

const groupChatsByDate = (chats: ChatItem[]) => {
  // First, deduplicate chats by thread_id (keeping the latest one for each thread_id)
  const uniqueThreadMap = new Map<string, ChatItem>();

  // Process chats in reverse order (latest first) to ensure we keep the most recent
  // entry for each unique thread_id
  [...chats].forEach(chat => {
    if (!uniqueThreadMap.has(chat.thread_id)) {
      uniqueThreadMap.set(chat.thread_id, chat);
    }
  });

  // Convert map back to array of unique chats
  const uniqueChats = Array.from(uniqueThreadMap.values());

  // Sort by last_message_at (when messages were sent) instead of last_accessed (when viewed)
  const sortedChats = [...uniqueChats].sort((a, b) => {
    // Use last_message_at as primary sort field, falling back to created_at
    const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 
                (a.created_at ? new Date(a.created_at).getTime() : 0);
    const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 
                (b.created_at ? new Date(b.created_at).getTime() : 0);
    return dateB - dateA;
  });

  const groups: { [key: string]: ChatItem[] } = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Earlier: []
  };

  sortedChats.forEach(chat => {
    if (!chat.last_message_at && !chat.created_at) {
      groups.Earlier.push(chat);
      return;
    }

    // Use last_message_at as primary date field with created_at as fallback
    const dateString = chat.last_message_at || chat.created_at;
    if (!dateString) {
      groups.Earlier.push(chat);
      return;
    }

    const date = parseISO(dateString);

    if (isToday(date)) {
      groups.Today.push(chat);
    } else if (isYesterday(date)) {
      groups.Yesterday.push(chat);
    } else if (isThisWeek(date)) {
      groups["This Week"].push(chat);
    } else if (isThisMonth(date)) {
      groups["This Month"].push(chat);
    } else {
      groups.Earlier.push(chat);
    }
  });

  return groups;
};

export default function Sidebar() {
  const pathname = usePathname();
  
  const {
    setMessages,
    setCreatingThread,
    setChatStarted,
    setPrompt
  } = useChatState();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deletingChat, setDeletingChat] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<ChatItem | null>(null);
  const { user } = useUser();
  const { userId } = useAuth();
  const chatContext = useContext(ChatContext);
  const currentThread = chatContext?.currentThread;
  const setChatList = chatContext?.setChatList;
  const chatList = chatContext?.chatList || [];
  const setCurrentThread = chatContext?.setCurrentThread;
  const setIntro = chatContext?.setIntro;
  const isLoading = chatContext?.isLoading;
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isError, setIsError] = useState(false);
  const userName = user ? (user.firstName || user.username || "User") : "User";
  const router = useRouter();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 640) {
        setIsExpanded(false);
      }
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Set CSS variable for sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isMobile ? '0px' : (isExpanded ? '280px' : '72px'));
  }, [isExpanded, isMobile]);

  useEffect(() => {
    if (!isLoading) {
      setIsLoadingChats(false);
    } else {
      setIsLoadingChats(true);
    }
  }, [isLoading]);

  const handleRetryFetch = () => {
    setIsError(false);
  };

  const toggleSidebar = () => setIsExpanded(!isExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // When navigating between pages (like settings to dashboard),
  // reset loading states after a short delay to ensure navigation completes
  useEffect(() => {
    if (navigatingTo) {
      const timer = setTimeout(() => {
        setIsLoadingChats(false);
        setNavigatingTo(null);
      }, 500); // Wait for navigation to complete
      
      return () => clearTimeout(timer);
    }
  }, [navigatingTo]);

  const handleCreateChat = async () => {
    // Standard flow for creating a new chat
    setCreatingThread(true);
    setChatStarted(false);
    try {
      const thread = await createThread();
      setMessages([]);
      setIntro!("new chat");
      setCurrentThread!(thread.id);
      if (isMobile) {
        setIsMobileMenuOpen(false);
      }
    } finally {
      setCreatingThread(false);
      setPrompt("");
    }
  };

  const handleDeleteClick = (chat: ChatItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    const isDeletingCurrentThread = chatToDelete.thread_id === currentThread;
    console.log("Deleting chat:", chatToDelete.thread_id, "Current thread:", currentThread, "Is current:", isDeletingCurrentThread);

    try {
      setDeletingChat(chatToDelete.thread_id);
      const chats = await deleteThread(userId!, chatToDelete.thread_id);
      setChatList!(chats.reverse());
      console.log("Deletion successful, remaining chats:", chats.length);

      if (isDeletingCurrentThread) {
        console.log("Deleted the current thread, switching to new chat");
        setMessages([]);

        setCurrentThread!("");
        setIntro!("new chat");

        setTimeout(() => {
          console.log("Creating new chat after deletion");
          handleCreateChat();
        }, 300);
      }
    } finally {
      setDeletingChat(null);
      setShowDeleteModal(false);
      setChatToDelete(null);
    }
  };

  
  const handleChatClick = async (chat: ChatItem) => {
    try {
      setMessages([]);
      setCreatingThread(true);
      setChatStarted(true);
      setLoadingChat(chat.thread_id); // Set loading state for the specific chat

      // Fetch messages from the thread
      const messages = await getMessages(chat.thread_id);

      // Update the UI with messages
      setMessages(messages.reverse());
      setCurrentThread!(chat.thread_id);
      setPrompt("");
      
      // Do NOT update thread activity timestamp when merely clicking/viewing a thread
      // This ensures threads only move to the top when new messages are sent
      
      if (isMobile) {
        setIsMobileMenuOpen(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setCreatingThread(false);
      setLoadingChat(null); // Clear loading state when done
    }
  };

  // Function to handle navigation with loading state
  const handleNavigation = (href: string, itemId: string) => {
    if (isLoadingChats) return;
    
    setNavigatingTo(itemId);
    router.push(href);
    
    // Reset loading state after navigation completes
    setTimeout(() => setNavigatingTo(null), 500);
  };

  // Determine if a navigation item is active based on the current pathname
  const isNavItemActive = (href: string) => {
    if (href === '/' && pathname === '/') {
      return true;
    }
    if (href !== '/' && pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

// Don't render the sidebar on the settings page
if (false) {
  return null;
}

  return (
    <>
      <div
        className={`${isMobile ? 'hidden' : 'block'} h-full relative`}
        style={{
          width: isExpanded ? 280 : 72,
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <motion.aside
          className={`
            fixed top-0 left-0 h-full z-20
            bg-white dark:bg-[#1E1E1E] border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm
          `}
          style={{
            width: isMobile ? 280 : (isExpanded ? 280 : 72),
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
          }}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50"
            variants={itemVariants}
          >
            <div className={`h-16 flex items-center ${isExpanded ? 'px-4' : 'justify-center'}`}>
              {isExpanded ? (
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700 flex items-center justify-center overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-gray-900 dark:text-gray-100 font-medium truncate text-sm">{userName}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.emailAddresses[0].emailAddress}</p>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-1 h-16 justify-center">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700 flex items-center justify-center overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors mt-1"
                    aria-label="Expand sidebar"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.nav 
            className="flex-1 overflow-y-auto px-3 pb-3 space-y-6 hide-scrollbar"
            variants={listVariants}
          >
            <motion.div className="pt-3" variants={itemVariants}>
              <button
                onClick={handleCreateChat}
                disabled={isLoadingChats}
                className={`
                  w-full flex items-center rounded-lg transition-all duration-200
                  ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                  bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white
                  ${isLoadingChats ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Plus className="h-5 w-5" />
                {isExpanded && <span className="ml-3 text-sm font-medium">New Chat</span>}
                {isLoadingChats && isExpanded && (
                  <Loader2 className="h-3 w-3 ml-2 animate-spin text-white" />
                )}
              </button>
            </motion.div>

            <motion.div 
              className={isExpanded ? 'space-y-1' : 'space-y-3'}
              variants={listVariants}
            >
              {navigationItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.href, item.id)}
                  disabled={isLoadingChats || navigatingTo === item.id}
                  className={`
                    w-full flex items-center rounded-lg transition-all duration-200
                    ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                    text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                    ${isLoadingChats ? 'opacity-50 cursor-not-allowed' : ''}
                    ${navigatingTo === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                    ${isNavItemActive(item.href) && !navigatingTo ? 'bg-emerald-50 text-emerald-700 dark:text-white border-l-2 border-emerald-600' : ''}
                  `}
                  variants={itemVariants}
                >
                  <item.icon className={`h-5 w-5 ${navigatingTo === item.id ? 'text-blue-500' : ''} ${isNavItemActive(item.href) && !navigatingTo ? 'text-emerald-700 dark:text-emerald-300' : ''}`} />
                  {isExpanded && (
                    <span className={`ml-3 text-sm 
                      ${navigatingTo === item.id ? 'text-blue-600 dark:text-blue-400' : ''}
                      ${isNavItemActive(item.href) && !navigatingTo ? 'text-emerald-700 dark:text-white' : ''}
                    `}>
                      {item.label}
                    </span>
                  )}
                  {(isLoadingChats || navigatingTo === item.id) && (
                    <Loader2 className={`h-3 w-3 ml-2 animate-spin ${navigatingTo === item.id ? 'text-blue-500' : 'text-gray-400'}`} />
                  )}
                </motion.button>
              ))}
            </motion.div>

            <motion.div 
              className="space-y-2 mt-6"
              variants={itemVariants}
            >
              {isExpanded && (
                <h3 className="px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Chats</h3>
              )}
              <div className="space-y-1">
                {isLoadingChats ? (
                  <ChatListSkeleton isExpanded={isExpanded} />
                ) : isError ? (
                  <div className="px-3 py-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <X className="h-5 w-5 text-red-500 dark:text-red-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Failed to load chats</p>
                    <button
                      onClick={handleRetryFetch}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : chatList.length === 0 ? (
                  <div className={`${isExpanded ? "px-3 py-4 text-center" : "p-2 flex justify-center"}`}>
                    {isExpanded ? (
                      <>
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No chats yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Click the &quot;New Chat&quot; button to start a conversation</p>
                      </>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center opacity-60">
                        <MessageCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                ) : Object.entries(groupChatsByDate(chatList)).map(([group, chats]) =>
                  chats.length > 0 && (
                    <motion.div 
                      key={group} 
                      className="mb-4"
                      variants={listVariants}
                    >
                      {isExpanded ? (
                        <div className="mb-2 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {group}
                        </div>
                      ) : (
                        <div className="mb-2 flex justify-center">
                          <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 rounded my-3"></div>
                        </div>
                      )}
                      {chats.map((chat: ChatItem) => (
                        <motion.div 
                          key={chat.thread_id} 
                          className="relative group"
                          variants={chatItemVariants}
                        >
                          <button
                            onClick={() => handleChatClick(chat)}
                            className={`
                              w-full flex items-center rounded-lg transition-all duration-200
                              ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                              ${currentThread === chat.thread_id
                                ? 'bg-emerald-50 text-emerald-700 dark:text-white border-l-2 border-emerald-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                              }
                            `}
                            disabled={loadingChat === chat.thread_id}
                          >
                            <div className="relative flex items-center min-w-0 w-full">
                              {loadingChat === chat.thread_id ? (
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                              ) : (
                              <MessageCircle className={`
                                h-5 w-5 flex-shrink-0
                                ${currentThread === chat.thread_id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}
                              `} />
                              )}
                              {isExpanded && (
                                                                  <div className="ml-3 flex-1 flex items-center justify-between min-w-0">
                                    <span className="text-sm font-medium truncate pr-2">
                                      {deletingChat === chat.thread_id ? (
                                        <span className="flex items-center text-gray-400">
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Deleting...
                                        </span>
                                      ) : loadingChat === chat.thread_id ? (
                                        <span className="flex items-center text-blue-600">
                                          <span className="ml-1">Loading messages...</span>
                                        </span>
                                      ) : (
                                        chat.name
                                      )}
                                    </span>
                                    {!deletingChat && !loadingChat && (
                                      <button
                                        onClick={(e) => handleDeleteClick(chat, e)}
                                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 ml-2 flex-shrink-0"
                                        aria-label="Delete chat"
                                      >
                                        <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                                      </button>
                                    )}
                                  </div>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          </motion.nav>

          <motion.div 
            className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50"
            variants={itemVariants}
          >
            <SignOutButton redirectUrl="/">
              <button
                className={`
                  w-full flex items-center rounded-lg transition-all duration-200
                  ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                  text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                `}
              >
                <LogOut className="h-5 w-5" />
                {isExpanded && <span className="ml-3 text-sm">Log out</span>}
              </button>
            </SignOutButton>
          </motion.div>
        </motion.aside>
      </div>

      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="md:hidden fixed top-4 left-4 z-[110] flex items-center justify-center bg-white dark:bg-[#1E1E1E] p-2.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-800"
          aria-label="Open menu"
        >
          <MessageCircle className="h-5 w-5 text-[#142F32] dark:text-white" />
        </button>
      )}

      {isMobile && (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed top-0 left-0 z-[100] h-full w-[280px] bg-white dark:bg-[#1E1E1E] shadow-xl flex flex-col"
              >
                <div className="h-16 flex items-center justify-between px-4 bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700 flex items-center justify-center overflow-hidden">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-gray-900 dark:text-gray-100 font-medium truncate text-sm">{userName}</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.emailAddresses[0].emailAddress}</p>
                    </div>
                    <button
                      onClick={toggleMobileMenu}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <button
                    onClick={handleCreateChat}
                    disabled={isLoadingChats}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white transition-all rounded-lg ${(isLoadingChats) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-medium">New Chat</span>
                    {isLoadingChats && (
                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                    )}
                  </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="space-y-2 px-3 py-3">
                    {navigationItems.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all 
                        ${isLoadingChats ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                        ${navigatingTo === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                        ${isNavItemActive(item.href) && !navigatingTo ? 'bg-emerald-50 text-emerald-700 dark:text-white border-l-2 border-emerald-600' : ''}
                        `}
                        onClick={() => handleNavigation(item.href, item.id)}
                        disabled={isLoadingChats || navigatingTo === item.id}
                      >
                        <item.icon className={`h-5 w-5 mr-3 
                          ${navigatingTo === item.id ? 'text-blue-500' : ''} 
                          ${isNavItemActive(item.href) && !navigatingTo ? 'text-emerald-700 dark:text-emerald-300' : ''}
                        `} />
                        <span className={`text-sm 
                          ${navigatingTo === item.id ? 'text-blue-600 dark:text-blue-400' : ''}
                          ${isNavItemActive(item.href) && !navigatingTo ? 'text-emerald-700 dark:text-white' : ''}
                        `}>
                          {item.label}
                        </span>
                        {(isLoadingChats || navigatingTo === item.id) && (
                          <Loader2 className={`h-3 w-3 ml-2 animate-spin ${navigatingTo === item.id ? 'text-blue-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex-1 flex flex-col min-h-0">
                    <h3 className="px-4 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recent Chats
                    </h3>
                    <div className="overflow-y-auto flex-1 hide-scrollbar px-3" style={{ height: "100%" }}>
                      {isLoadingChats ? (
                        <ChatListSkeleton isExpanded={true} />
                      ) : isError ? (
                        <div className="px-3 py-4 text-center">
                          <div className="flex justify-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <X className="h-5 w-5 text-red-500 dark:text-red-400" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Failed to load chats</p>
                          <button
                            onClick={handleRetryFetch}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : chatList.length === 0 ? (
                        <div className={`px-3 py-4 text-center ${isExpanded ? "" : "mx-auto"}`}>
                          <div className="flex justify-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No chats yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Click the &quot;New Chat&quot; button to start a conversation</p>
                        </div>
                      ) : (
                        Object.entries(groupChatsByDate(chatList)).map(([group, chats]) =>
                          chats.length > 0 && (
                            <div key={group} className="mb-4">
                              <div className="mb-2 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {group}
                              </div>
                              {chats.map((chat: ChatItem) => (
                                <div key={chat.thread_id} className="relative group">
                                  <button
                                    onClick={() => handleChatClick(chat)}
                                    className={`
                                      w-full flex items-center rounded-lg transition-all duration-200
                                      px-3 py-2.5
                                      ${currentThread === chat.thread_id
                                        ? 'bg-emerald-50 text-emerald-700 dark:text-white border-l-2 border-emerald-600'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                                      }
                                    `}
                                  >
                                    <div className="relative flex items-center min-w-0 w-full">
                                      <MessageCircle className={`
                                        h-5 w-5 flex-shrink-0
                                        ${currentThread === chat.thread_id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}
                                      `} />
                                      <span className="ml-3 text-sm font-medium truncate flex-1 text-left pr-10">
                                        {chat.name}
                                      </span>
                                    </div>
                                  </button>

                                  <button
                                    onClick={(e) => handleDeleteClick(chat, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                                    disabled={deletingChat === chat.thread_id}
                                  >
                                    {deletingChat === chat.thread_id ? (
                                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
                  <SignOutButton redirectUrl="/">
                    <button className="w-full flex items-center px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                      <LogOut className="h-5 w-5 mr-3" />
                      <span className="text-sm">Log out</span>
                    </button>
                  </SignOutButton>
                </div>
              </motion.div>
              <div
                className="fixed inset-0 bg-black/30 z-[80] backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </>
          )}
        </AnimatePresence>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setChatToDelete(null);
        }}
        title="Delete Chat"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this chat? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setChatToDelete(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#142F32] dark:focus:ring-offset-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={!!deletingChat}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingChat ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .hide-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
        .hide-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 4px;
        }
        .hide-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
        }
        @media (prefers-color-scheme: dark) {
          .hide-scrollbar:hover::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.2);
          }
        }
      `}</style>
    </>
  );
} 
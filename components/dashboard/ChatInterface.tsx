"use client"

import type React from "react"

import { useState, useRef, useEffect, type FormEvent, useContext } from "react"
import {
  Send,
  User,
  Loader2,
  X,
  File,
  ImageIcon,
  FileText,
  MessageSquare,
  Shield,
  Globe
} from "lucide-react"
import { Snackbar, Alert } from "@mui/material"
import {
  createThread,
  addChatHistory,
  updateThreadActivity
} from "@/utils/actions"
import { useAuth, useUser } from "@clerk/nextjs"
// import Attachment from "./Attachment"
import { ChatContext } from "@/app/contexts/ChatContext"
import { motion, AnimatePresence } from "framer-motion"
// import { createPortal } from "react-dom"
import { SignOutButton } from "@clerk/nextjs"
import { MessageBubble } from "./MessageBubble"
import { Message } from "@/app/contexts/ChatContextProvider"
import Link from 'next/link';
import { ShortcutAssistance } from "./ShortcutAssistance"
// import { Switch } from "@/components/ui/switch"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const messageListVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30 
    }
  }
};

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loading?: boolean;
  initialMessage?: string;
}

export function ChatInterface({
  messages,
  setMessages,
  initialMessage,
  loading,
}: ChatInterfaceProps) {
  // Local state
  const [creatingThread, setCreatingThread] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [prompt, setPrompt] = useState(initialMessage || "");
  
  // Web search state
  // const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const webSearchEnabled: boolean = false;
  
  // File attachment states
  const [attachedFiles, setAttachedFiles] = useState<Array<{id: string; name: string; type: string; url?: string}>>([]);
  const [currentAttachment, setCurrentAttachment] = useState<string | null>(null);
  
  // Other UI states
  const [generating, setGenerating] = useState(false)
  const [showSnackbar, setShowSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<{src: string; alt: string} | null>(null)
  const [isProcessingRequest, setIsProcessingRequest] = useState(false)
  
  const isSubmittingRef = useRef(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasCreatedThread = useRef(false)
  const threadId = useRef<string>()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const userIdRef = useRef<string | null | undefined>()
  const currentThreadRef = useRef<string | null>()

  // State for admin check
  const [isUserAdmin, setIsUserAdmin] = useState(false); 
  const [checkingAdminStatus, setCheckingAdminStatus] = useState(true);

  const { userId } = useAuth()
  const { user, isLoaded } = useUser()
  const userName = user ? user.firstName || user.username || "User" : "User"

  const chatContext = useContext(ChatContext)
  const currentThread = chatContext?.currentThread
  const setCurrentThread = chatContext?.setCurrentThread
  const setChatList = chatContext?.setChatList
  const [isFirstChunk, setIsFirstChunk] = useState(true)

  // useEffect to fetch admin status from the backend
  useEffect(() => {
    if (isLoaded && userId) { 
      setCheckingAdminStatus(true);
      fetch('/api/check-admin')
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin !== undefined) {
            setIsUserAdmin(data.isAdmin);
          }
          console.log("/api/check-admin response:", data);
        })
        .catch(error => {
          console.error('Error fetching admin status:', error);
          setIsUserAdmin(false); 
        })
        .finally(() => {
          setCheckingAdminStatus(false);
        });
    } else if (!isLoaded) {
      setCheckingAdminStatus(true); // Still loading, keep checking
    } else if (!userId) {
      // No user, not admin, stop checking
      setCheckingAdminStatus(false);
      setIsUserAdmin(false);
    }
  }, [isLoaded, userId]);

  // Update refs when values change
  useEffect(() => {
    userIdRef.current = userId;
    currentThreadRef.current = currentThread;
  }, [userId, currentThread]);

  // Set sidebar width CSS variable
  useEffect(() => {
    const updateSidebarWidth = () => {
      const isMobileView = window.innerWidth < 768;
      const sidebarWidth = isMobileView ? 0 : 280;
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    };
    
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    
    return () => {
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages, generating])

  useEffect(() => {
    const createNewThreadIfNeeded = async () => {
      if (user && !hasCreatedThread.current && !currentThread) {
        setCreatingThread(true);
        console.log("No current thread. Creating new thread...");
        try {
          const newThread = await createThread();
          if (newThread && newThread.id) {
            setCurrentThread!(newThread.id);
            threadId.current = newThread.id;
            console.log("Thread created:", newThread.id);
          } else {
            throw new Error("Failed to create thread: Invalid response");
          }
        } catch (error) {
          console.error("Error creating thread:", error);
          setShowSnackbar(true);
          setSnackbarMessage("Error: Failed to initialize chat.");
        } finally {
          setCreatingThread(false);
          hasCreatedThread.current = true;
        }
      } else if (user && !hasCreatedThread.current && currentThread) {
         console.log("Using existing thread:", currentThread);
         threadId.current = currentThread; // Ensure local ref is also set
         hasCreatedThread.current = true;
      }
    };
    createNewThreadIfNeeded();
  }, [user, currentThread, setCurrentThread, creatingThread]);

  useEffect(() => {
    inputRef.current?.focus()
  }, [messages])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Effect to update prompt when initialMessage changes
  useEffect(() => {
    if (initialMessage && initialMessage.trim() !== "") {
      setPrompt(initialMessage);
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [initialMessage]);

  // File utility functions
  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase()
  }

  const isImageFile = (filename: string) => {
    const ext = getFileExtension(filename).toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
  }

  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) return <ImageIcon className="h-4 w-4" />

    const ext = getFileExtension(filename).toLowerCase()
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) {
      return <FileText className="h-4 w-4" />
    }

    return <File className="h-4 w-4" />
  }

  const removeAttachment = (attachmentId: string) => {
    const attachmentToRemove = attachedFiles.find((file) => file.id === attachmentId)

    if (attachmentToRemove?.url && attachmentToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(attachmentToRemove.url)
    }

    setAttachedFiles((prev) => prev.filter((file) => file.id !== attachmentId))
    if (currentAttachment === attachmentId) {
      setCurrentAttachment(null)
    }
  }

  const handleSendMessage = async (
    e?: FormEvent<HTMLFormElement>
  ) => {
    if (e) e.preventDefault()

    if (generating || creatingThread || isProcessingRequest || isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setIsProcessingRequest(true)

    const messageText = prompt.trim()

    if (!chatStarted) {
      setChatStarted(true)
    }

    if (!messageText && attachedFiles.length === 0) {
      setShowSnackbar(true)
      setSnackbarMessage("error: Please enter a message or attach a file")
      isSubmittingRef.current = false
      setIsProcessingRequest(false)
      return
    }

    const latestUserId = userIdRef.current
    const latestThreadId = currentThreadRef.current || threadId.current

    console.log("messageText", messageText)
    console.log("attachedFiles", attachedFiles)
    console.log("latestUserId", latestUserId)
    console.log("latestThreadId", latestThreadId)
    console.log("currentThread", currentThread)

    if (!latestUserId || !latestThreadId) {
      setShowSnackbar(true)
      setSnackbarMessage("error: Session information missing. Please refresh the page.")
      isSubmittingRef.current = false
      setIsProcessingRequest(false)
      return
    }

    const newMessage: Message = {
      role: "user",
      content: messageText,
      attachments: attachedFiles,
      status: "success",
    }

    setMessages((prevMessages) => [...prevMessages, newMessage])
    setGenerating(true)
    setIsFirstChunk(true)
    setPrompt("")

    const currentAttachmentIds = attachedFiles.map((file) => file.id)

    setAttachedFiles([])
    setCurrentAttachment(null)

    try {
      console.log("messages.length", messages.length)
      console.log("messages", messages)
      console.log('currentThread', currentThread)
      
      if (messages.length === 0) {
        const words = messageText.split(" ")
        const chatName = words.length > 5 ? words.slice(0, 5).join(" ") + "..." : messageText || "New Chat"
        console.log("Creating initial chat history with name:", chatName)
        console.log("latestThreadId", latestThreadId)
        console.log("latestUserId", latestUserId)
        try {
          const chats = await addChatHistory(latestUserId, latestThreadId, chatName);
          if (chats && setChatList) {
            setChatList(chats.reverse());
          }
        } catch (error) {
          console.error("Error adding chat history:", error);
        }
      } else {
        try {
          const updatedChats = await updateThreadActivity(latestUserId, latestThreadId);
          if (updatedChats && updatedChats.length > 0 && setChatList) {
            setChatList(updatedChats.reverse());
          }
        } catch (error) {
          console.error("Error updating thread activity:", error);
        }
      }

      const tempAssistantMessageId = `temp-${Date.now()}`
      let hasStartedReceivingContent = false

      // Use different endpoint based on web search setting
      const endpoint = webSearchEnabled ? "/api/chat-with-functions" : "/api/chat";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: messageText,
          threadId: latestThreadId,
          userId: latestUserId,
          userName: userName,
          userEmail: user?.emailAddresses[0].emailAddress,
          attachmentIds: currentAttachmentIds.length > 0 ? currentAttachmentIds : undefined,
          webSearchEnabled: webSearchEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""

      setIsFirstChunk(false);
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          console.log("Received chunk:", chunk)
          assistantResponse += chunk

          if (!hasStartedReceivingContent && chunk.trim()) {
            hasStartedReceivingContent = true
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                role: "assistant",
                content: assistantResponse.trim(),
                attachments: [],
                id: tempAssistantMessageId,
              },
            ])
          } else if (hasStartedReceivingContent) {
            setMessages((prevMessages) => {
              return prevMessages.map((msg) =>
                msg.id === tempAssistantMessageId ? { ...msg, content: assistantResponse.trim() } : msg,
              )
            })
          }

          await new Promise((resolve) => setTimeout(resolve, 10))
        }
      } catch (streamError) {
        console.error("Error reading stream:", streamError)
      }

      const cleanedResponse = assistantResponse.trim()

      if (hasStartedReceivingContent) {
        setMessages((prevMessages) => {
          return prevMessages.map((msg) =>
            msg.id === tempAssistantMessageId ? { ...msg, content: cleanedResponse } : msg,
          )
        })
      }
    } catch (error) {
      console.error("Error in chat:", error)

      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1]
        if (lastMessage && lastMessage.role === "user") {
          return [...prevMessages.slice(0, -1), { ...lastMessage, status: "error" }]
        }
        if (prevMessages.length > 1 && prevMessages[prevMessages.length - 1].role === "assistant") {
          return prevMessages.slice(0, -1)
        }
        return prevMessages
      })

      setShowSnackbar(true)
      setSnackbarMessage("error: Error generating response")
    } finally {
      setGenerating(false)
      isSubmittingRef.current = false
      setIsProcessingRequest(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleShortcutClick = (shortcut: string) => {
    // Set the prompt first
    setPrompt(shortcut)
    
    // Call a modified version of handleSendMessage with the shortcut text
    handleShortcutSubmit(shortcut)
  }

  const handleShortcutSubmit = async (messageText: string) => {
    if (generating || creatingThread || isProcessingRequest || isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setIsProcessingRequest(true)

    if (!chatStarted) {
      setChatStarted(true)
    }

    if (!messageText.trim()) {
      setShowSnackbar(true)
      setSnackbarMessage("error: Please enter a message")
      isSubmittingRef.current = false
      setIsProcessingRequest(false)
      return
    }

    const latestUserId = userIdRef.current
    const latestThreadId = currentThreadRef.current || threadId.current

    if (!latestUserId || !latestThreadId) {
      setShowSnackbar(true)
      setSnackbarMessage("error: Session information missing. Please refresh the page.")
      isSubmittingRef.current = false
      setIsProcessingRequest(false)
      return
    }

    const newMessage: Message = {
      role: "user",
      content: messageText,
      attachments: [],
      status: "success",
    }

    setMessages((prevMessages) => [...prevMessages, newMessage])
    setGenerating(true)
    setIsFirstChunk(true)
    setPrompt("")

    try {
      if (messages.length === 0) {
        const words = messageText.split(" ")
        const chatName = words.length > 5 ? words.slice(0, 5).join(" ") + "..." : messageText || "New Chat"
        try {
          const chats = await addChatHistory(latestUserId, latestThreadId, chatName);
          if (chats && setChatList) {
            setChatList(chats.reverse());
          }
        } catch (error) {
          console.error("Error adding chat history:", error);
        }
      } else {
        try {
          const updatedChats = await updateThreadActivity(latestUserId, latestThreadId);
          if (updatedChats && updatedChats.length > 0 && setChatList) {
            setChatList(updatedChats.reverse());
          }
        } catch (error) {
          console.error("Error updating thread activity:", error);
        }
      }

      const tempAssistantMessageId = `temp-${Date.now()}`
      let hasStartedReceivingContent = false

      const endpoint = webSearchEnabled ? "/api/chat-with-functions" : "/api/chat";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: messageText,
          threadId: latestThreadId,
          userId: latestUserId,
          userName: userName,
          userEmail: user?.emailAddresses[0].emailAddress,
          webSearchEnabled: webSearchEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""

      setIsFirstChunk(false);
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantResponse += chunk

          if (!hasStartedReceivingContent && chunk.trim()) {
            hasStartedReceivingContent = true
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                role: "assistant",
                content: assistantResponse.trim(),
                attachments: [],
                id: tempAssistantMessageId,
              },
            ])
          } else if (hasStartedReceivingContent) {
            setMessages((prevMessages) => {
              return prevMessages.map((msg) =>
                msg.id === tempAssistantMessageId ? { ...msg, content: assistantResponse.trim() } : msg,
              )
            })
          }

          await new Promise((resolve) => setTimeout(resolve, 10))
        }
      } catch (streamError) {
        console.error("Error reading stream:", streamError)
      }

      const cleanedResponse = assistantResponse.trim()

      if (hasStartedReceivingContent) {
        setMessages((prevMessages) => {
          return prevMessages.map((msg) =>
            msg.id === tempAssistantMessageId ? { ...msg, content: cleanedResponse } : msg,
          )
        })
      }
    } catch (error) {
      console.error("Error in chat:", error)

      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1]
        if (lastMessage && lastMessage.role === "user") {
          return [...prevMessages.slice(0, -1), { ...lastMessage, status: "error" }]
        }
        if (prevMessages.length > 1 && prevMessages[prevMessages.length - 1].role === "assistant") {
          return prevMessages.slice(0, -1)
        }
        return prevMessages
      })

      setShowSnackbar(true)
      setSnackbarMessage("error: Error generating response")
    } finally {
      setGenerating(false)
      isSubmittingRef.current = false
      setIsProcessingRequest(false)
    }
  }

  useEffect(() => {
    return () => {
      attachedFiles.forEach((file) => {
        if (file.url && file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url)
        }
      })
      if (previewImage && previewImage.src.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage.src)
      }
    }
  }, [attachedFiles, previewImage])

  const renderAttachedFiles = () => {
    if (attachedFiles.length === 0) return null

  return (
      <div className="bg-white px-3 py-2 rounded-lg border border-[#E3FFCC]/60 w-full">
        <h3 className="text-sm font-medium text-[#142F32] mb-2">Attached Files</h3>
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file) => {
            const isImage = file.type.startsWith("image/") || isImageFile(file.name)
            const isUploading = false 

            return (
              <div
                key={file.id}
                className={`flex items-center gap-2 pl-2 pr-1 py-1.5 bg-[#E3FFCC]/20 rounded-md text-sm text-[#142F32] group border border-[#E3FFCC]/40 transition-all duration-300 ${
                  isUploading ? "opacity-60 filter blur-[0.5px]" : "opacity-100"
                }`}
              >
                {isImage ? <ImageIcon className="h-4 w-4" /> : getFileIcon(file.name)}
                <span className="truncate max-w-[150px]">{file.name}</span>
                {isUploading && <span className="text-xs text-[#142F32]/70 ml-1">Uploading...</span>}
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="p-1 rounded-full hover:bg-black/10"
                  disabled={isUploading}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
      if (textarea.scrollHeight > 120) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    };
    adjustHeight();
    return () => {
      textarea.style.height = 'auto';
      textarea.style.overflowY = 'auto';
    };
  }, [prompt]);

  const renderInputField = () => (
    <textarea
      ref={inputRef}
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      onKeyDown={handleKeyDown}
      onInput={(e) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        const newHeight = Math.min(target.scrollHeight, 120);
        target.style.height = `${newHeight}px`;
        if (target.scrollHeight > 120) {
          target.style.overflowY = 'auto';
        } else {
          target.style.overflowY = 'hidden';
        }
      }}
      placeholder="Ask me anything about weed..."
      className="w-full py-4 px-5 pr-12 bg-white text-[#282930] placeholder-[#777C90] focus:outline-none focus:ring-2 focus:ring-[#E3FFCC]/70 text-sm resize-none min-h-[44px] max-h-[120px] overflow-auto"
      disabled={creatingThread}
      rows={1}
      style={{ 
        overflowWrap: 'break-word', 
        wordWrap: 'break-word'
      }}
    />
  )

  return (
    <motion.div 
      className="flex flex-col h-full w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] right-[5%] w-[60%] h-[50%] rounded-full bg-gradient-to-br from-emerald-200/30 to-emerald-200/10 blur-3xl" />
        <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-emerald-200/30 to-emerald-200/10 blur-3xl" />
      </div>

      <motion.div 
        className="fixed top-0 right-0 z-50 h-16 flex items-center justify-end px-4 md:px-6 bg-emerald-50/95 backdrop-blur-sm border-b border-emerald-200/20 shadow-sm" 
        style={{ left: 'var(--sidebar-width, 280px)' }}
        variants={fadeInVariants}
      >
        <motion.div 
          className="flex items-center" 
          ref={profileMenuRef}
          variants={itemVariants}
        >
          {!checkingAdminStatus && isUserAdmin && (
            <Link href="/admin" passHref>
              <button
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400/60 to-purple-400/40 flex items-center justify-center hover:from-purple-400/80 hover:to-purple-400/60 transition-all shadow-md mr-2"
                title="Admin Panel"
              >
                <Shield className="h-5 w-5 text-[#142F32]" /> 
              </button>
            </Link>
          )}
          <button
            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/60 to-emerald-400/40 flex items-center justify-center hover:from-emerald-400/80 hover:to-emerald-400/60 transition-all shadow-md"
            title="Profile settings"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
                          <User className="h-5 w-5 text-white" />
          </button>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-14 right-4 w-52 py-2 bg-white rounded-md shadow-lg border border-gray-100 z-50 origin-top-right"
                style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
              >
                <div
                  className="absolute w-0 h-0 border-solid"
                  style={{
                    bottom: "100%",
                    right: "12px",
                    borderWidth: "0 8px 8px 8px",
                    borderColor: "transparent transparent white transparent",
                    filter: "drop-shadow(0 -1px 1px rgba(0,0,0,0.05))",
                  }}
                />
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-[#282930] tracking-wide">{userName}</p>
                  <p className="text-xs text-[#777C90] font-light mt-0.5">{user?.emailAddresses[0].emailAddress}</p>
                </div>
                <div className="py-1">
                  <SignOutButton redirectUrl="/">
                    <button className="block w-full text-left px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center">
                    <span className="w-5 h-5 mr-2 inline-flex items-center justify-center opacity-80">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 17L21 12L16 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Logout
                  </button>
                  </SignOutButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>


      <div className="flex-1 overflow-hidden flex flex-col relative pt-16">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty-state"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={containerVariants}
              className={`flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto ${loading ? 'opacity-80' : ''}`}
            >
              <motion.div 
                className={`w-20 h-20 rounded-full bg-emerald-200/30 flex items-center justify-center mb-8 ${loading ? 'animate-pulse' : ''}`}
                variants={itemVariants}
              >
                                  <MessageSquare className="h-10 w-10 text-emerald-700" />
              </motion.div>
              <motion.h2 
                                  className="text-2xl font-bold text-gray-800 mb-2"
                variants={itemVariants}
              >
                Hello {userName}
              </motion.h2>
              {loading && (
                <motion.div 
                  className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg text-center max-w-md"
                  variants={itemVariants}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-sm text-gray-500 font-medium">Loading previous conversation...</p>
                    <div className="w-full space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <motion.p 
                                  className="text-gray-600 text-center max-w-md mb-6"
                variants={itemVariants}
              >
                How can I help you today?
              </motion.p>
              
              <motion.div 
                className="w-full max-w-xl"
                variants={itemVariants}
              >
                <ShortcutAssistance onShortcutClick={handleShortcutClick} />
                <form onSubmit={handleSendMessage}>
                  <div className="flex flex-col gap-3 w-full">
                    {renderAttachedFiles()}
                    {/* Web Search Toggle */}
                    {/* <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-[#E3FFCC]/60">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#142F32]" />
                        <span className="text-sm text-[#282930]">Search the web</span>
                      </div>
                      <Switch
                        checked={webSearchEnabled}
                        onCheckedChange={setWebSearchEnabled}
                        className="data-[state=checked]:bg-[#142F32]"
                      />
                    </div> */}
                    <div className="flex w-full rounded-lg overflow-hidden shadow-lg border border-emerald-200/60">
                      <div className="relative flex-1 flex items-center bg-white rounded-l-lg">
                        {renderInputField()}
                      </div>
                      <button
                        type="submit"
                        disabled={
                          generating ||
                          creatingThread ||
                          isProcessingRequest ||
                          (!prompt.trim() && attachedFiles.length === 0)
                        }
                        className="p-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-all shadow-md flex items-center justify-center"
                      >
                        {generating || isProcessingRequest ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={messageListVariants}
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pt-5 pb-28 px-3 md:pr-4 md:pl-0 space-y-4 relative z-10"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(119, 124, 144, 0.3) transparent",
              }}
            >
              
              <div className="max-w-3xl mx-auto w-full space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center space-y-4 py-6">
                    <div className="w-16 h-16 rounded-full bg-[#E3FFCC]/30 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#142F32] animate-spin" />
                    </div>
                    <p className="text-[#777C90] text-sm">Loading conversation...</p>
                    <div className="w-full max-w-md space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <div 
                            className={`rounded-lg p-3 max-w-[85%] ${
                              i % 2 === 0 
                                ? 'bg-white shadow-sm animate-pulse' 
                                : 'bg-emerald-100/20 shadow-sm animate-pulse'
                            }`}
                            style={{ animationDelay: `${i * 0.15}s` }}
                          >
                            <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
                            <div className="h-2 bg-gray-200 rounded-full mb-2.5"></div>
                            <div className="h-2 bg-gray-200 rounded-full w-32"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <motion.div key={message.id || index} variants={messageVariants} custom={index}>
                        <MessageBubble
                          content={message.content}
                          isUser={message.role === "user"}
                          attachments={message.attachments || []}
                          status={message.status}
                          onImageClick={(src, alt) => {
                            setPreviewImage({ src, alt });
                          }}
                        />
                      </motion.div>
                    ))}

                    {(generating && isFirstChunk) && (
                      <motion.div 
                        className="p-4 rounded-lg max-w-[240px] flex items-center space-x-2 bg-gradient-to-r from-white to-emerald-50 border border-emerald-200/60 shadow-sm"
                        variants={fadeInVariants}
                      >
                        {webSearchEnabled ? (
                          <>
                            <Globe className="h-4 w-4 text-emerald-700 animate-pulse" />
                            <span className="text-sm text-emerald-700">Thinking and searching...</span>
                          </>
                        ) : (
                          <>
                            <div className="bg-emerald-700 h-2 w-2 rounded-full animate-[bounce_1s_infinite_-0.3s]"></div>
                            <div className="bg-emerald-700 h-2 w-2 rounded-full animate-[bounce_1s_infinite_-0.15s]"></div>
                            <div className="bg-emerald-700 h-2 w-2 rounded-full animate-[bounce_1s_infinite]"></div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
                
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed bottom-0 right-0 p-3 border-t border-[#E3FFCC]/30 z-20 flex justify-center"
            style={{
              boxShadow: "0 -4px 20px rgba(119, 124, 144, 0.07)",
              backgroundColor: "rgb(240 253 244)",
              left: 'var(--sidebar-width, 280px)',
              transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="w-full max-w-3xl mx-auto">
              <form onSubmit={handleSendMessage}>
                <div className="flex flex-col gap-3 w-full">
                  {renderAttachedFiles()}
                  {/* Web Search Toggle */}
                  {/* <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-[#E3FFCC]/60">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#142F32]" />
                      <span className="text-sm text-[#282930]">Search the web</span>
                    </div>
                    <Switch
                      checked={webSearchEnabled}
                      onCheckedChange={setWebSearchEnabled}
                      className="data-[state=checked]:bg-[#142F32]"
                    />
                  </div> */}
                  <div className="flex w-full rounded-lg overflow-hidden shadow-lg border border-emerald-200/60">
                    <div className="relative flex-1 flex items-center bg-white rounded-l-lg">
                      {renderInputField()}
                    </div>
                    <button
                      type="submit"
                      disabled={
                        generating ||
                        creatingThread ||
                        isProcessingRequest ||
                        (!prompt.trim() && attachedFiles.length === 0)
                      }
                      className="p-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-all shadow-md flex items-center justify-center"
                    >
                      {generating || isProcessingRequest ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={snackbarMessage.includes("error") ? "error" : "success"}
          sx={{
            width: "100%",
            borderRadius: "10px",
            fontSize: "0.95rem",
            "& .MuiAlert-icon": {
              fontSize: "24px",
            },
            "& .MuiAlert-message": {
              padding: "8px 0",
              fontWeight: 500,
            },
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            "&.MuiAlert-standardError": {
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
            },
            "&.MuiAlert-standardSuccess": {
              backgroundColor: "#DCFCE7",
              color: "#16A34A",
            },
          }}
        >
          {snackbarMessage.replace("error: ", "")}
        </Alert>
      </Snackbar>
    </motion.div>
  )
}



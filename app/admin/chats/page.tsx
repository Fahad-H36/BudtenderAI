"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare,
  Search,
  User,
  Clock,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "@/components/dashboard/MessageBubble"

interface ChatData {
  user_id: string
  user_email: string
  user_name: string
  plan_type: string
  thread_id: string
  thread_name: string
  created_at: string
  last_message_at: string
  is_most_recent: boolean
  summary?: string | null
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  attachments: Array<{ id: string; name: string; type: string }>
}

interface User {
  user_id: string
  user_email: string
  user_name: string
  plan_type: string
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [view, setView] = useState<"list" | "detail">("list")

  useEffect(() => {
    fetchChats()
  }, [])

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messages.length > 0 && !messagesLoading) {
      const messagesContainer = document.getElementById("messages-container")
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }, [messages, messagesLoading])

  const fetchChats = async () => {
    try {
      setLoading(true)
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/admin/chats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (threadId: string) => {
    try {
      setMessagesLoading(true)
      const response = await fetch(`/api/admin/messages/${threadId}`)

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        console.error("Failed to fetch messages")
        setMessages([])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleChatClick = (chat: ChatData) => {
    setSelectedChat(chat)
    setView("detail")
    fetchMessages(chat.thread_id)
  }

  const handleBackToList = () => {
    setView("list")
    setSelectedChat(null)
    setMessages([])
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.thread_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Group chats by user
  const chatsByUser = filteredChats.reduce(
    (acc, chat) => {
      if (!acc[chat.user_id]) {
        acc[chat.user_id] = {
          user: {
            user_id: chat.user_id,
            user_email: chat.user_email,
            user_name: chat.user_name,
            plan_type: chat.plan_type,
          },
          chats: [],
        }
      }
      acc[chat.user_id].chats.push(chat)
      return acc
    },
    {} as Record<string, { user: User; chats: ChatData[] }>,
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading chats...</p>
          </div>
        </div>
      </div>
    )
  }

  if (view === "detail" && selectedChat) {
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Chats</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedChat.thread_name}</h1>
              <p className="text-gray-600 text-sm">
                Conversation with {selectedChat.user_name} ({selectedChat.user_email})
              </p>
            </div>
          </div>

          <div className="text-right text-sm text-gray-500">
            <div>Created: {formatDate(selectedChat.created_at)}</div>
            <div>Last activity: {formatDate(selectedChat.last_message_at)}</div>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="bg-white border border-gray-200 shadow-sm flex-grow flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-gray-50 py-3 px-6 flex-shrink-0">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              Chat History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow flex flex-col overflow-hidden">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12 flex-grow">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading messages...</span>
              </div>
            ) : (
              <ScrollArea className="h-full p-6" id="messages-container">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No messages found in this chat.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className="flex items-start max-w-[80%]">
                            {message.role === "assistant" && (
                              <Avatar className="mr-3 mt-1 h-8 w-8 bg-slate-100 text-slate-600">
                                <AvatarFallback>AI</AvatarFallback>
                              </Avatar>
                            )}

                            <div className="flex flex-col">
                              <div className={`text-xs text-gray-500 mb-1 px-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                                {message.role === "user" ? "User" : "Assistant"} • {formatShortDate(message.created_at)}
                              </div>
                              <MessageBubble
                                content={message.content}
                                isUser={message.role === "user"}
                                attachments={message.attachments}
                                status="success"
                              />
                            </div>

                            {message.role === "user" && (
                              <Avatar className="ml-3 mt-1 h-8 w-8 bg-slate-100 text-slate-600">
                                <AvatarFallback>{getInitials(selectedChat.user_name)}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat Management</h1>
          <p className="text-gray-600 mt-1">View and manage all conversations happening in your finance chatbot.</p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={fetchChats} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chats</p>
                <p className="text-3xl font-bold text-gray-900">{chats.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{Object.keys(chatsByUser).length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per User</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Object.keys(chatsByUser).length > 0
                    ? Math.round((chats.length / Object.keys(chatsByUser).length) * 10) / 10
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by user email, name, or chat title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chats by User */}
      <div className="space-y-6">
        {Object.keys(chatsByUser).length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No chats found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Chats will appear here once users start conversations"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.values(chatsByUser).map(({ user, chats: userChats }) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* <Avatar className="h-10 w-10 bg-blue-100 text-blue-600">
                        <AvatarFallback>{getInitials(user.user_name)}</AvatarFallback>
                      </Avatar> */}
                      <Avatar className="h-10 w-10 bg-slate-100 text-slate-300">                        
                        <AvatarFallback>{getInitials(user.user_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg text-gray-700 font-semibold">{user.user_name}</h3>
                        <p className="text-sm text-gray-500">{user.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{userChats.length} chats</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userChats.map((chat) => (
                      <div
                        key={chat.thread_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleChatClick(chat)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">{chat.thread_name}</h4>
                              {chat.summary && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{chat.summary}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatShortDate(chat.last_message_at)}</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

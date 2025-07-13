"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import type React from "react"
import { useState, useEffect } from "react"
import { Shield, Users, MessageSquare, LogOut, Menu, X, BarChart3, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { SignOutButton, useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  id: string
  icon: React.ElementType
  label: string
  href: string
  description: string
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    icon: BarChart3,
    label: "Dashboard",
    href: "/admin",
    description: "Overview and analytics",
  },
  {
    id: "users",
    icon: Users,
    label: "Users",
    href: "/admin/users",
    description: "Manage user accounts",
  },
  {
    id: "chats",
    icon: MessageSquare,
    label: "Chats",
    href: "/admin/chats",
    description: "View all conversations",
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  // Check if on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
        setIsExpanded(false)
      } else {
        setSidebarOpen(true)
        setIsExpanded(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const isNavItemActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  const sidebarWidth = isMobile ? (sidebarOpen ? 280 : 0) : isExpanded ? 280 : 80

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed positioned */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: isMobile && !sidebarOpen ? -280 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-lg overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center space-x-3"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                    <p className="text-xs text-gray-500">Finance Chatbot</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-2 bg-blue-100 rounded-lg mx-auto"
                >
                  <Shield className="h-6 w-6 text-blue-600" />
                </motion.div>
              )}
            </AnimatePresence>

            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isExpanded ? <X className="h-4 w-4 text-gray-600" /> : <Menu className="h-4 w-4 text-gray-600" />}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Back to Dashboard Button */}
            <motion.button
              onClick={() => handleNavigation("/dashboard")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-700 hover:bg-blue-50 mb-4"
            >
              <ArrowLeft
                className={`h-5 w-5 text-gray-500 hover:text-blue-600 transition-colors ${isExpanded ? "mr-3" : "mx-auto"}`}
              />

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-col items-start overflow-hidden"
                  >
                    <span>Back to Dashboard</span>
                    <span className="text-xs text-gray-400 group-hover:text-blue-500 mt-0.5 transition-colors">Return to main app</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Separator */}
            {isExpanded && (
              <div className="flex items-center py-2">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-400 font-medium">ADMIN TOOLS</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            )}

            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item.href)

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-500"} ${
                      isExpanded ? "mr-3" : "mx-auto"
                    }`}
                  />

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex flex-col items-start overflow-hidden"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{item.description}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <AnimatePresence>
              {isExpanded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {user && (
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName || user.username || "Admin"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                      </div>
                    </div>
                  )}

                  <SignOutButton redirectUrl="/">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Log Out
                    </Button>
                  </SignOutButton>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-3"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <SignOutButton redirectUrl="/">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Log Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </SignOutButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Mobile header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b lg:hidden fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-2">
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-10" />
          </div>
        </div>
      )}

      {/* Main content - Now properly positioned beside the sidebar */}
      <div
        className="min-h-screen bg-gray-50 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          paddingTop: isMobile ? "4rem" : 0,
        }}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

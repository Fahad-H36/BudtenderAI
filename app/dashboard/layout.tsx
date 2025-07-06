"use client";

import { ChatContextProvider } from "@/app/contexts/ChatContextProvider";
import { ChatProvider } from "@/app/contexts/ChatContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <ChatProvider>
        <ChatContextProvider>
          <div className="relative min-h-screen flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              {children}
            </div>
          </div>
        </ChatContextProvider>
      </ChatProvider>
    </AuthProvider>
  );
} 
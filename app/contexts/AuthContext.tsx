"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

type UserData = {
  userId: string | null;
  email: string | null;
  userName: string | null;
  loading: boolean;
};

interface AuthContextType {
  userData: UserData;
}

const defaultUserData: UserData = {
  userId: null,
  email: null,
  userName: null,
  loading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    const initializeUserData = async () => {
      // Wait until Clerk has loaded the user
      if (!authLoaded || !userLoaded) return;
      
      if (userId && user) {
        // Initialize with basic user data directly from Clerk
        setUserData({
          userId,
          email: user.primaryEmailAddress?.emailAddress || null,
          userName: user.firstName || user.username || 'User',
          loading: false,
        });
      } else {
        setUserData({ ...defaultUserData, loading: false });
      }
    };

    initializeUserData();
  }, [userId, user, authLoaded, userLoaded]);

  return (
    <AuthContext.Provider value={{ userData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 
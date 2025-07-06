import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { checkUserOnboarded, UserProfileDB } from '@/utils/actions';

interface UserProfileHookResult {
  userProfile: UserProfileDB | null;
  isLoading: boolean;
  error: Error | null;
  userName: string;
  isOnboarded: boolean;
  refetchProfile: (forceFetch?: boolean) => Promise<void>;
}

/**
 * Custom hook to fetch and manage user profile data
 * Prioritizes name from Supabase user profile over Clerk data
 */
export function useUserProfile(): UserProfileHookResult {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { userId } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileDB | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  // Define userName with priority for Supabase profile
  const userName = userProfile?.name || 
                  (isClerkLoaded && user ? (user.firstName || user.username || "there") : "there");

  const fetchProfile = async (skipCache = false) => {
    if (!userId || !isClerkLoaded) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("🟡 Fetching user profile from Supabase...");
      const { isOnboarded: onboardedStatus, profile } = await checkUserOnboarded(userId, { skipCache });
      
      if (profile) {
        console.log("🟢 User profile loaded from Supabase:", profile);
        setUserProfile(profile);
      } else {
        console.log("🟡 No Supabase profile found, using Clerk data");
        setUserProfile(null);
      }
      
      setIsOnboarded(onboardedStatus);
      setError(null);
    } catch (err) {
      console.error("🔴 Error fetching user profile:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on load
  useEffect(() => {
    fetchProfile();
  }, [userId, isClerkLoaded]);

  // Function to manually refetch profile data
  const refetchProfile = async (forceFetch = false) => {
    await fetchProfile(forceFetch);
  };

  return {
    userProfile,
    isLoading,
    error,
    userName,
    isOnboarded,
    refetchProfile
  };
} 
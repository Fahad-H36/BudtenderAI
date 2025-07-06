import supabase from "@/lib/supabaseClient";

// Type definitions for user data
export interface User {
  id?: number;
  user_id: string;
  user_email: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all users from the database
 */
export async function getAllUsers(): Promise<{ data: User[] | null; error: any }> {
  try {
    const response = await fetch('/api/admin/users');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
}

/**
 * Fetch a single user by user_id
 */
export async function getUserById(userId: string): Promise<{ data: User | null; error: any }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user');
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }
}

/**
 * Update a user's information
 */
export async function updateUser(userId: string, userData: Partial<User>): Promise<{ success: boolean; error: any }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }
    
    const result = await response.json();
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error: any }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
    
    const result = await response.json();
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error };
  }
}

/**
 * Search users by email
 */
export async function searchUsersByEmail(email: string): Promise<{ data: User[] | null; error: any }> {
  try {
    const response = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to search users');
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: null, error };
  }
}

/**
 * Filter users by plan type
 */
export async function filterUsersByPlan(planType: string): Promise<{ data: User[] | null; error: any }> {
  try {
    const response = await fetch(`/api/admin/users?plan=${encodeURIComponent(planType)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to filter users');
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error filtering users:', error);
    return { data: null, error };
  }
}

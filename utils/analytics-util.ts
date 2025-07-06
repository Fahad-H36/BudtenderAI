import supabase from "@/lib/supabaseClient";

// Type definitions for monthly earnings data
export interface MonthlyEarnings {
  id: number;
  year: number;
  month: number;
  total_earnings: number;
  pro_earnings: number;
  power_earnings: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all monthly earnings from the database
 */
export async function getAllMonthlyEarnings(): Promise<{ data: MonthlyEarnings[] | null; error: any }> {
  try {
    const response = await fetch('/api/admin/analytics');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch monthly earnings');
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching monthly earnings:', error);
    return { data: null, error };
  }
}

/**
 * Filter monthly earnings by year
 */
export async function getMonthlyEarningsByYear(year: number): Promise<{ data: MonthlyEarnings[] | null; error: any }> {
  try {
    const response = await fetch(`/api/admin/analytics?year=${year}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch monthly earnings for year');
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching monthly earnings for year:', error);
    return { data: null, error };
  }
}

/**
 * Get monthly earnings for a specific time range
 * @param months - Number of months to fetch (e.g., 3, 6, 12)
 */
export async function getMonthlyEarningsRange(months: number): Promise<{ data: MonthlyEarnings[] | null; error: any }> {
  try {
    const response = await fetch(`/api/admin/analytics?months=${months}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch monthly earnings for last ${months} months`);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching monthly earnings for last ${months} months:`, error);
    return { data: null, error };
  }
} 
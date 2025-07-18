import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const months = searchParams.get('months');
    
    let query = supabase.from('monthly_earnings').select('*');
    
    // Apply filters if needed
    if (year) {
      query = query.eq('year', parseInt(year));
    }
    
    if (months) {
      // Calculate date for X months ago
      const today = new Date();
      const monthsAgo = new Date();
      monthsAgo.setMonth(today.getMonth() - parseInt(months));
      
      // Convert to ISO string format for comparison
      const monthsAgoStr = monthsAgo.toISOString();
      
      query = query.gte('created_at', monthsAgoStr);
    }
    
    // Order by year and month
    query = query.order('year', { ascending: true }).order('month', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching monthly earnings:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in analytics API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
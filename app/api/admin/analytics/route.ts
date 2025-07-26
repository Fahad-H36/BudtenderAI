import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import supabase from '@/lib/supabaseClient';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.privateMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week'; // week, month, quarter, year
    const granularity = searchParams.get('granularity') || 'day'; // day, week, month

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, user_email, created_at')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    const now = new Date();
    const startDate = new Date();

    // Set start date based on timeframe
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Calculate basic statistics
    const totalUsers = users.length;
    
    const todayUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate.toDateString() === now.toDateString();
    }).length;

    const thisWeekUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return userDate > weekAgo;
    }).length;

    const thisMonthUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return userDate > monthAgo;
    }).length;

    // Calculate growth rates
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const lastWeekUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate > lastWeekStart && userDate <= lastWeekEnd;
    }).length;

    const weekGrowthRate = lastWeekUsers > 0 
      ? Math.round(((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100)
      : thisWeekUsers > 0 ? 100 : 0;

    // Calculate last month for month growth rate
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 2);
    const lastMonthEnd = new Date();
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);

    const lastMonthUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate > lastMonthStart && userDate <= lastMonthEnd;
    }).length;

    const monthGrowthRate = lastMonthUsers > 0 
      ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : thisMonthUsers > 0 ? 100 : 0;

    // Generate time series data for charts
    const timeSeriesData = [];
    const filteredUsers = users.filter(user => new Date(user.created_at) >= startDate);

    // Group users by time period
    const usersByPeriod = new Map();

    filteredUsers.forEach(user => {
      const userDate = new Date(user.created_at);
      let periodKey;

      if (granularity === 'day') {
        periodKey = userDate.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (granularity === 'week') {
        const startOfWeek = new Date(userDate);
        startOfWeek.setDate(userDate.getDate() - userDate.getDay());
        periodKey = startOfWeek.toISOString().split('T')[0];
      } else if (granularity === 'month') {
        periodKey = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
      }

      if (periodKey) {
        usersByPeriod.set(periodKey, (usersByPeriod.get(periodKey) || 0) + 1);
      }
    });

    // Fill in missing periods with zero values
    const startDateForLoop = new Date(startDate);
    let currentDate = startDateForLoop;
    while (currentDate <= now) {
      let periodKey;
      
      if (granularity === 'day') {
        periodKey = currentDate.toISOString().split('T')[0];
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      } else if (granularity === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        periodKey = startOfWeek.toISOString().split('T')[0];
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
      } else if (granularity === 'month') {
        periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }

      if (periodKey) {
        timeSeriesData.push({
          period: periodKey,
          users: usersByPeriod.get(periodKey) || 0,
          cumulative: 0 // Will calculate below
        });
      }
    }

    // Calculate cumulative users
    let cumulative = users.filter(user => new Date(user.created_at) < startDate).length;
    timeSeriesData.forEach(item => {
      cumulative += item.users;
      item.cumulative = cumulative;
    });

    // Top registration days
    const registrationsByDay = new Map();
    users.forEach(user => {
      const day = new Date(user.created_at).toISOString().split('T')[0];
      registrationsByDay.set(day, (registrationsByDay.get(day) || 0) + 1);
    });

    const topRegistrationDays = Array.from(registrationsByDay.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([date, count]) => ({ date, count }));

    // User retention analysis (simple version)
    const retentionData = {
      oneDay: 0,
      oneWeek: 0,
      oneMonth: 0
    };

    // Email domain analysis
    const emailDomains = new Map();
    users.forEach(user => {
      const domain = user.user_email.split('@')[1];
      emailDomains.set(domain, (emailDomains.get(domain) || 0) + 1);
    });

    const topDomains = Array.from(emailDomains.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count, percentage: (count / totalUsers * 100).toFixed(1) }));

    const analyticsData = {
      summary: {
        totalUsers,
        todayUsers,
        thisWeekUsers,
        thisMonthUsers,
        weekGrowthRate,
        monthGrowthRate,
        lastUpdated: now.toISOString()
      },
      timeSeries: {
        timeframe,
        granularity,
        data: timeSeriesData
      },
      insights: {
        topRegistrationDays,
        topEmailDomains: topDomains,
        averageUsersPerDay: thisWeekUsers / 7,
        averageUsersPerWeek: thisMonthUsers / 4,
        retention: retentionData
      },
      metadata: {
        dataRange: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        totalDataPoints: timeSeriesData.length,
        queryParams: {
          timeframe,
          granularity
        }
      }
    };

    return NextResponse.json(analyticsData);
    
  } catch (error) {
    console.error('Error in analytics API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
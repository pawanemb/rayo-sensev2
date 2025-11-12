import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Simple interfaces
interface GrowthDataPoint {
  label: string;
  year: number;
  count: number;
  period_number: number;
  date?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Get simple parameters
    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('period_type') || 'day') as 'day' | 'month';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    console.log('👥 Simple User Growth API:', { periodType, startDate, endDate });

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 });
    }

    // Helper function to convert UTC to IST date
    const getISTDate = (utcTimestamp: string): string => {
      const utcDate = new Date(utcTimestamp);
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5:30 hours
      return istDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
    };

    // Fetch users using Admin API
    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Debug: Check a few users before filtering
    console.log(`👥 Sample users before filtering:`, usersData.users.slice(0, 3).map(u => ({
      email: u.email,
      created_at_utc: u.created_at,
      created_at_ist: u.created_at ? getISTDate(u.created_at) : 'null'
    })));

    // Filter users in date range using IST conversion
    const users = usersData.users.filter(user => {
      if (!user.created_at) return false;
      const istDate = getISTDate(user.created_at);
      const isInRange = istDate >= startDate && istDate <= endDate;
      
      // Debug log for users around the target date
      if (istDate === '2025-08-27' || istDate === '2025-08-28') {
        console.log(`👥 Date check: ${user.email} - IST: ${istDate} - Range: ${startDate} to ${endDate} - Included: ${isInRange}`);
      }
      
      return isInRange;
    });

    console.log(`👥 Found ${users?.length || 0} users in date range`);
    console.log(`👥 Date range being used: ${startDate} to ${endDate}`);

    // Get top 10 latest users for debugging with more user details
    const latestUsers = users.slice(-10).map(u => ({
      id: u.id,
      email: u.email,
      created_at_utc: u.created_at,
      created_at_ist_date: u.created_at ? getISTDate(u.created_at) : 'null',
      utc_date_only: u.created_at ? u.created_at.split('T')[0] : 'null',
      role: u.app_metadata?.role || 'user',
      provider: u.app_metadata?.provider || 'email',
      confirmed_at: u.confirmed_at,
      last_sign_in_at: u.last_sign_in_at
    }));

    // Get all users from the full dataset (not filtered by date) to show top users
    const { data: allUsersData } = await supabaseAdmin.auth.admin.listUsers();
    const topUsers = allUsersData.users
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10)
      .map(u => ({
        id: u.id,
        email: u.email,
        created_at_ist: u.created_at ? getISTDate(u.created_at) : 'null',
        role: u.app_metadata?.role || 'user',
        provider: u.app_metadata?.provider || 'email',
        last_sign_in_ist: u.last_sign_in_at ? getISTDate(u.last_sign_in_at) : 'never'
      }));

    // Simple grouping
    const growthData: GrowthDataPoint[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (periodType === 'day') {
      // Create day-by-day data
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Count users created on this IST day
        const dayUsers = users.filter(u => {
          if (!u.created_at) return false;
          const istDate = getISTDate(u.created_at);
          return istDate === dateStr;
        });

        growthData.push({
          label: d.getDate().toString(),
          year: d.getFullYear(),
          count: dayUsers.length,
          period_number: d.getDate(),
          date: dateStr
        });
      }
    } else {
      // Create month-by-month data
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      
      for (let m = new Date(startMonth); m <= endMonth; m.setMonth(m.getMonth() + 1)) {
        const year = m.getFullYear();
        const month = m.getMonth();
        
        // Count users created in this month (IST)
        const monthUsers = users.filter(u => {
          if (!u.created_at) return false;
          const istDate = getISTDate(u.created_at);
          const pDate = new Date(istDate);
          return pDate.getFullYear() === year && pDate.getMonth() === month;
        });

        growthData.push({
          label: months[month],
          year: year,
          count: monthUsers.length,
          period_number: month + 1
        });
      }
    }

    // Simple calculations
    const totalUsers = growthData.reduce((sum, item) => sum + item.count, 0);
    const currentPeriodUsers = growthData[growthData.length - 1]?.count || 0;
    const lastPeriodUsers = growthData[growthData.length - 2]?.count || 0;

    console.log('👥 Result:', { 
      totalUsers, 
      periods: growthData.length,
      currentPeriodUsers,
      lastPeriodUsers
    });

    // Add debug data to response
    const response = {
      total_users: totalUsers,
      growth_data: growthData,
      current_period_users: currentPeriodUsers,
      last_period_users: lastPeriodUsers,
      period_type: periodType,
      debug_raw_data: {
        date_range: { startDate, endDate },
        total_found_users: users.length,
        total_users_in_system: allUsersData.users.length,
        latest_10_users_in_range: latestUsers,
        top_10_users_overall: topUsers,
        sample_filtering: growthData.slice(-3) // Last 3 periods
      }
    };

    console.log('👥 User Growth Result with debug:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ User Growth API Error:', error);
    return handleApiError(error);
  }
}

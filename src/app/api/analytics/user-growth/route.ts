import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
    console.log('👥 Fetching ALL users - looping through all pages...');
    // Fetch ALL users by looping through pages
    let allUsers: Array<{ created_at: string }> = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      console.log(`👥 Fetching page ${page}...`);
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        console.error('❌ Error fetching users:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      const count = data?.users?.length ?? 0;
      allUsers = allUsers.concat(data?.users ?? []);
      console.log(`👥 Page ${page}: fetched ${count} users, total so far: ${allUsers.length}`);
      // If we got less than perPage, we're done
      if (count < perPage) {
        break;
      }
      page++;
    }
    console.log(`👥 Total users fetched: ${allUsers.length}`);
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('period_type') || 'month') as 'day' | 'month';
    const endDate = searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : new Date();
    const startDate = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : new Date(new Date().setMonth(endDate.getMonth() - 11));
    console.log(`👥 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}, Period: ${periodType}`);
    // Group users by period (day or month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthData: GrowthDataPoint[] = [];
    if (periodType === 'day') {
      // Create day-by-day data
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        // Count users created on this day
        const dayUsers = allUsers.filter(u => {
          if (!u.created_at) return false;
          const createdDate = new Date(u.created_at);
          const createdDateStr = createdDate.toISOString().split('T')[0];
          return createdDateStr === dateStr;
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
      const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      for (let m = new Date(startMonth); m <= endMonth; m.setMonth(m.getMonth() + 1)) {
        const year = m.getFullYear();
        const month = m.getMonth();
        // Count users created in this month
        const monthUsers = allUsers.filter(u => {
          if (!u.created_at) return false;
          const createdDate = new Date(u.created_at);
          return createdDate.getFullYear() === year && createdDate.getMonth() === month;
        });
        growthData.push({
          label: months[month],
          year: year,
          count: monthUsers.length,
          period_number: month + 1
        });
      }
    }
    // Return response
    const response = {
      total_users: allUsers.length, // ALL users in system
      growth_data: growthData,
      current_period_users: growthData[growthData.length - 1]?.count || 0,
      last_period_users: growthData[growthData.length - 2]?.count || 0,
      period_type: periodType
    };
    console.log('👥 User Growth Response:', {
      total: response.total_users,
      periods: growthData.length
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ User Growth API Error:', error);
    return handleApiError(error);
  }
}

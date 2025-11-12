import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface GrowthDataPoint {
  label: string;
  year: number;
  count: number;
  period_number: number;
  date?: string;
}

interface ProjectGrowthResponse {
  total_projects: number;
  growth_data: GrowthDataPoint[];
  current_period_projects: number;
  last_period_projects: number;
  period_type: 'day' | 'month';
}

// Helper function to format date for Supabase queries
const formatDateForQuery = (date: Date): string => {
  // Date is already a UTC timestamp with correct IST boundaries from parsing
  // Just convert to ISO string format that Supabase expects
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('period_type') as 'day' | 'month') || 'month';
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    // Parse and validate dates
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      // Parse dates properly - treat as IST dates, not UTC
      // Input: "2025-01-12" means Jan 12, 2025 in IST timezone
      const [startYear, startMonth, startDay] = startDateParam.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDateParam.split('-').map(Number);

      if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format. Use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }

      // Create UTC timestamps for IST dates (timezone-independent)
      // IST is UTC+5:30, so to get UTC time for IST midnight, we subtract 5.5 hours
      const istOffset = 5.5 * 60 * 60 * 1000;

      // Start of IST day: 2025-01-12 00:00:00 IST = 2025-01-11 18:30:00 UTC
      const startUTC = Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0) - istOffset;
      startDate = new Date(startUTC);

      // End of IST day: 2025-01-12 23:59:59.999 IST = 2025-01-12 18:29:59.999 UTC
      const endUTC = Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999) - istOffset;
      endDate = new Date(endUTC);

      if (startDate > endDate) {
        return NextResponse.json(
          { success: false, error: 'Start date must be before end date.' },
          { status: 400 }
        );
      }

      console.log('[PROJECT-GROWTH] Date parsing:');
      console.log('  Input params:', startDateParam, 'to', endDateParam);
      console.log('  UTC boundaries for query:', startDate.toISOString(), 'to', endDate.toISOString());
    } else {
      // Default to last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      startDate = sixMonthsAgo;
      endDate = now;
    }

    // Validate period type
    if (!['day', 'month'].includes(periodType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period_type. Must be "day" or "month".' },
        { status: 400 }
      );
    }

    // Fetch all projects in date range from Supabase
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('created_at')
      .gte('created_at', formatDateForQuery(startDate))
      .lte('created_at', formatDateForQuery(endDate))
      .order('created_at', { ascending: true });

    console.log('[PROJECT-GROWTH] Query dates:', {
      startDate: formatDateForQuery(startDate),
      endDate: formatDateForQuery(endDate),
      totalFound: projects?.length || 0
    });

    if (error) {
      console.error('[PROJECT-GROWTH] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects from database.' },
        { status: 500 }
      );
    }

    // Get total projects count (ALL projects in database, not just in date range)
    const { count: totalProjectsCount, error: countError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[PROJECT-GROWTH] Error counting total projects:', countError);
    }

    const totalProjects = totalProjectsCount || 0;

    // Helper function to convert UTC date to IST
    const toIST = (date: Date): Date => {
      if (!date) return new Date();
      const d = new Date(date);
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(d.getTime() + istOffset);
    };

    // Helper function to convert UTC timestamp to IST date string
    const toISTDateString = (utcTimestamp: string): string => {
      const date = new Date(utcTimestamp);
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istDate = new Date(date.getTime() + istOffset);
      const year = istDate.getUTCFullYear();
      const month = (istDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = istDate.getUTCDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Process data based on period type
    const growthData: GrowthDataPoint[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (periodType === 'day') {
      // Daily data
      const currentDate = new Date(startDate);
      const finalDate = new Date(endDate);

      // Don't show future dates - stop at today (IST)
      const todayIST = toIST(new Date());
      const today = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate(), 0, 0, 0, 0);
      const actualFinalDate = finalDate > today ? today : finalDate;

      while (currentDate <= actualFinalDate) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Count projects created on this day (in IST)
        const count = projects?.filter(p => {
          if (!p.created_at) return false;
          const projectDateIST = toISTDateString(p.created_at);
          return projectDateIST === dateStr;
        }).length || 0;

        growthData.push({
          label: `${months[currentDate.getMonth()]} ${currentDate.getDate()}`,
          year: currentDate.getFullYear(),
          count: count,
          period_number: currentDate.getDate(),
          date: dateStr
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Monthly data
      const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      const currentDate = new Date(startMonth);

      // Don't show future months - stop at current month (IST)
      const todayIST = toIST(new Date());
      const currentMonth = new Date(todayIST.getFullYear(), todayIST.getMonth(), 1);
      const actualEndMonth = endMonth > currentMonth ? currentMonth : endMonth;

      while (currentDate <= actualEndMonth) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Count projects created in this month (in IST)
        const count = projects?.filter(p => {
          if (!p.created_at) return false;
          const date = new Date(p.created_at);
          const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
          const istDate = new Date(date.getTime() + istOffset);
          return istDate.getUTCFullYear() === year && istDate.getUTCMonth() === month;
        }).length || 0;

        growthData.push({
          label: months[month],
          year: year,
          count: count,
          period_number: month + 1
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Calculate current and last period projects
    if (growthData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_projects: totalProjects,
          growth_data: [],
          current_period_projects: 0,
          last_period_projects: 0,
          period_type: periodType,
          message: 'No data available for the selected date range'
        }
      });
    }

    // Final safety check: filter out any future dates
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const todayStr = `${nowIST.getUTCFullYear()}-${(nowIST.getUTCMonth() + 1).toString().padStart(2, '0')}-${nowIST.getUTCDate().toString().padStart(2, '0')}`;

    const filteredGrowthData = growthData.filter(item => {
      if (periodType === 'day' && item.date) {
        return item.date <= todayStr;
      }
      return true; // For monthly data, keep all
    });

    console.log('[PROJECT-GROWTH] Final filter:', {
      todayStr,
      beforeFilter: growthData.length,
      afterFilter: filteredGrowthData.length,
      lastDate: filteredGrowthData[filteredGrowthData.length - 1]?.date
    });

    const currentPeriodProjects = filteredGrowthData[filteredGrowthData.length - 1]?.count || 0;
    const lastPeriodProjects = filteredGrowthData[filteredGrowthData.length - 2]?.count || 0;

    const response: ProjectGrowthResponse = {
      total_projects: totalProjects,
      growth_data: filteredGrowthData,
      current_period_projects: currentPeriodProjects,
      last_period_projects: lastPeriodProjects,
      period_type: periodType
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    return handleApiError(error);
  }
}

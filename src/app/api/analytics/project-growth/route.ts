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
const formatDateForQuery = (date: Date, isStartOfDay: boolean = true): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  if (isStartOfDay) {
    return `${year}-${month}-${day} 00:00:00`;
  } else {
    return `${year}-${month}-${day} 23:59:59`;
  }
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
      const startDateInput = new Date(startDateParam);
      const endDateInput = new Date(endDateParam);

      if (isNaN(startDateInput.getTime()) || isNaN(endDateInput.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format. Use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }

      if (startDateInput > endDateInput) {
        return NextResponse.json(
          { success: false, error: 'Start date must be before end date.' },
          { status: 400 }
        );
      }

      startDate = startDateInput;
      endDate = endDateInput;
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
      .gte('created_at', formatDateForQuery(startDate, true))
      .lte('created_at', formatDateForQuery(endDate, false))
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[PROJECT-GROWTH] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects from database.' },
        { status: 500 }
      );
    }

    const totalProjects = projects?.length || 0;

    // Process data based on period type
    const growthData: GrowthDataPoint[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (periodType === 'day') {
      // Daily data
      const currentDate = new Date(startDate);
      const finalDate = new Date(endDate);

      while (currentDate <= finalDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Count projects created on this day
        const count = projects?.filter(p => {
          if (!p.created_at) return false;
          const projectDate = new Date(p.created_at).toISOString().split('T')[0];
          return projectDate === dateStr;
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

      while (currentDate <= endMonth) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Count projects created in this month
        const count = projects?.filter(p => {
          if (!p.created_at) return false;
          const projectDate = new Date(p.created_at);
          return projectDate.getFullYear() === year && projectDate.getMonth() === month;
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

    const currentPeriodProjects = growthData[growthData.length - 1]?.count || 0;
    const lastPeriodProjects = growthData[growthData.length - 2]?.count || 0;

    const response: ProjectGrowthResponse = {
      total_projects: totalProjects,
      growth_data: growthData,
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

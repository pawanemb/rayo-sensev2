import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
// Interface for growth data points
interface GrowthDataPoint {
  label: string;
  year: number;
  count: number;
  period_number: number;
  date?: string; // ISO date string for daily data
}
// Interface for API response
interface BlogsGrowthResponse {
  total_blogs: number;
  growth_data: GrowthDataPoint[];
  current_period_blogs: number;
  last_period_blogs: number;
  period_type: 'day' | 'month';
}
// Helper function to convert UTC date to IST
const toIST = (date: Date): Date => {
  if (!date) return new Date();
  const d = new Date(date);
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(d.getTime() + istOffset);
};
// Helper function to format date for MongoDB queries with IST timezone handling
const formatDateForMongoDB = (date: Date, isStartOfDay: boolean = true): Date => {
  // Since MongoDB stores in UTC, we need to create proper UTC boundaries for IST dates
  // Input date string like "2025-01-12" should cover the full IST day
  if (isStartOfDay) {
    // Start of IST day: 2025-01-12 00:00:00 IST = 2025-01-11 18:30:00 UTC
    const startOfDayIST = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(startOfDayIST.getTime() - istOffset);
  } else {
    // End of IST day: 2025-01-12 23:59:59 IST = 2025-01-12 18:29:59 UTC
    const endOfDayIST = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(endOfDayIST.getTime() - istOffset);
  }
};
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
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
      // Validate date range (max 1 year)
      const maxRange = 365 * 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() > maxRange) {
        return NextResponse.json(
          { success: false, error: 'Date range cannot exceed 1 year.' },
          { status: 400 }
        );
      }
      if (startDate > endDate) {
        return NextResponse.json(
          { success: false, error: 'Start date must be before end date.' },
          { status: 400 }
        );
      }
      console.log('[BLOGS-GROWTH] Date parsing:');
      console.log('  Input params:', startDateParam, 'to', endDateParam);
      console.log('  UTC boundaries for MongoDB:', startDate.toISOString(), 'to', endDate.toISOString());
      console.log('  IST representation:', toIST(startDate).toLocaleString('en-IN'), 'to', toIST(endDate).toLocaleString('en-IN'));
    } else {
      // Default to last 6 months if no dates provided
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      startDate = formatDateForMongoDB(sixMonthsAgo, true);
      endDate = formatDateForMongoDB(now, false);
    }
    // Validate period type
    if (!['day', 'month'].includes(periodType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period_type. Must be "day" or "month".' },
        { status: 400 }
      );
    }
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const blogsCollection = db.collection('blogs');
    // Get total blogs count (ALL blogs, not just in date range)
    let totalBlogs: number;
    try {
      totalBlogs = await blogsCollection.countDocuments({
        created_at: { $exists: true }
      });
    } catch (error) {
      console.error('[BLOGS-GROWTH] Error counting blogs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to count total blogs.' },
        { status: 500 }
      );
    }
    // Create aggregation pipeline based on period type
    let groupByFormat: string;
    let sortField: string;
    if (periodType === 'day') {
      groupByFormat = '%Y-%m-%d';
      sortField = '_id';
    } else {
      groupByFormat = '%Y-%m';
      sortField = '_id';
    }
    // MongoDB aggregation pipeline to group blogs by time period with IST timezone
    // Using $dateAdd approach (same as old route) for compatibility
    const pipeline = [
      {
        $match: {
          created_at: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $addFields: {
          // Convert UTC stored dates to IST for proper grouping
          created_at_ist: {
            $dateAdd: {
              startDate: {
                $dateAdd: {
                  startDate: '$created_at',
                  unit: 'hour',
                  amount: 5
                }
              },
              unit: 'minute',
              amount: 30
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$created_at_ist'
            }
          },
          count: { $sum: 1 },
          year: { $first: { $year: '$created_at_ist' } },
          month: { $first: { $month: '$created_at_ist' } },
          day: { $first: { $dayOfMonth: '$created_at_ist' } }
        }
      },
      {
        $sort: { [sortField]: 1 }
      }
    ];
    let aggregationResult: Array<{
      _id: string;
      count: number;
      year: number;
      month: number;
      day: number;
    }>;
    try {
      // Set a reasonable timeout for the aggregation
      aggregationResult = await blogsCollection.aggregate(pipeline, {
        maxTimeMS: 30000, // 30 second timeout
        allowDiskUse: true // Allow disk usage for large datasets
      }).toArray() as Array<{
        _id: string;
        count: number;
        year: number;
        month: number;
        day: number;
      }>;
    } catch (error) {
      console.error('[BLOGS-GROWTH] Aggregation error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process analytics data. Please try a smaller date range.' },
        { status: 500 }
      );
    }
    // Process the aggregation results into growth data points
    const growthData: GrowthDataPoint[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Create a map for quick lookup
    const resultMap = new Map();
    aggregationResult.forEach(item => {
      resultMap.set(item._id, item);
    });
    // Generate complete time series data (fill gaps with 0) with proper IST handling
    if (periodType === 'day') {
      // Use IST dates for proper daily iteration
      const istStartDate = toIST(startDate);
      const istEndDate = toIST(endDate);
      const currentDate = new Date(istStartDate.getFullYear(), istStartDate.getMonth(), istStartDate.getDate());
      const finalDate = new Date(istEndDate.getFullYear(), istEndDate.getMonth(), istEndDate.getDate());
      // Don't show future dates - stop at today (IST)
      const nowUTC = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(nowUTC.getTime() + istOffset);
      const todayISTYear = nowIST.getUTCFullYear();
      const todayISTMonth = nowIST.getUTCMonth();
      const todayISTDate = nowIST.getUTCDate();
      const today = new Date(todayISTYear, todayISTMonth, todayISTDate);
      const actualFinalDate = finalDate > today ? today : finalDate;
      console.log('[BLOGS-GROWTH] Today capping:', {
        nowUTC: nowUTC.toISOString(),
        nowIST: nowIST.toISOString(),
        today: today.toDateString(),
        finalDate: finalDate.toDateString(),
        actualFinalDate: actualFinalDate.toDateString()
      });
      let iterationCount = 0;
      const maxIterations = 400; // Safety limit for 1 year + buffer
      while (currentDate <= actualFinalDate && iterationCount < maxIterations) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const result = resultMap.get(dateStr);
        growthData.push({
          label: currentDate.getDate().toString(),
          year: currentDate.getFullYear(),
          count: result ? result.count : 0,
          period_number: currentDate.getDate(),
          date: dateStr
        });
        currentDate.setDate(currentDate.getDate() + 1);
        iterationCount++;
      }
    } else {
      // Monthly data with proper IST handling
      const istStartDate = toIST(startDate);
      const istEndDate = toIST(endDate);
      const currentDate = new Date(istStartDate.getFullYear(), istStartDate.getMonth(), 1);
      const endDateMonth = new Date(istEndDate.getFullYear(), istEndDate.getMonth(), 1);
      // Don't show future months - stop at current month (IST)
      const todayIST = toIST(new Date());
      const currentMonth = new Date(todayIST.getFullYear(), todayIST.getMonth(), 1);
      const actualEndMonth = endDateMonth > currentMonth ? currentMonth : endDateMonth;
      let iterationCount = 0;
      const maxIterations = 50; // Safety limit for reasonable month ranges
      while (currentDate <= actualEndMonth && iterationCount < maxIterations) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const monthStr = `${year}-${month}`;
        const result = resultMap.get(monthStr);
        growthData.push({
          label: months[currentDate.getMonth()],
          year: currentDate.getFullYear(),
          count: result ? result.count : 0,
          period_number: currentDate.getMonth() + 1
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
        iterationCount++;
      }
    }
    // Calculate current and last period blogs for comparison
    if (growthData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_blogs: totalBlogs,
          growth_data: [],
          current_period_blogs: 0,
          last_period_blogs: 0,
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
    console.log('[BLOGS-GROWTH] Final filter:', {
      todayStr,
      beforeFilter: growthData.length,
      afterFilter: filteredGrowthData.length,
      lastDate: filteredGrowthData[filteredGrowthData.length - 1]?.date
    });
    const currentPeriodBlogs = filteredGrowthData[filteredGrowthData.length - 1]?.count || 0;
    const lastPeriodBlogs = filteredGrowthData[filteredGrowthData.length - 2]?.count || 0;
    const response: BlogsGrowthResponse = {
      total_blogs: totalBlogs,
      growth_data: filteredGrowthData,
      current_period_blogs: currentPeriodBlogs,
      last_period_blogs: lastPeriodBlogs,
      period_type: periodType
    };
    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('[BLOGS-GROWTH] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';

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

// Helper function to format date for MongoDB queries
const formatDateForMongoDB = (date: Date, isStartOfDay: boolean = true): Date => {
  if (isStartOfDay) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  } else {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
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
      // Validate date format
      const startDateInput = new Date(startDateParam);
      const endDateInput = new Date(endDateParam);

      if (isNaN(startDateInput.getTime()) || isNaN(endDateInput.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format. Use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }

      // Validate date range (max 1 year)
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (endDateInput.getTime() - startDateInput.getTime() > maxRange) {
        return NextResponse.json(
          { success: false, error: 'Date range cannot exceed 1 year.' },
          { status: 400 }
        );
      }

      if (startDateInput > endDateInput) {
        return NextResponse.json(
          { success: false, error: 'Start date must be before end date.' },
          { status: 400 }
        );
      }

      startDate = formatDateForMongoDB(startDateInput, true);
      endDate = formatDateForMongoDB(endDateInput, false);
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

    // Get total blogs count in the date range
    let totalBlogs: number;
    try {
      totalBlogs = await blogsCollection.countDocuments({
        created_at: {
          $gte: startDate,
          $lte: endDate,
          $exists: true
        }
      });
    } catch (error) {
      console.error('[BLOGS-GROWTH] Error counting blogs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to count blogs in the specified date range.' },
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

    // MongoDB aggregation pipeline to group blogs by time period
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
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$created_at'
            }
          },
          count: { $sum: 1 },
          year: { $first: { $year: '$created_at' } },
          month: { $first: { $month: '$created_at' } },
          day: { $first: { $dayOfMonth: '$created_at' } }
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
      }).toArray();
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

    // Generate complete time series data (fill gaps with 0)
    if (periodType === 'day') {
      const currentDate = new Date(startDate);
      const finalDate = new Date(endDate);

      let iterationCount = 0;
      const maxIterations = 400; // Safety limit for 1 year + buffer

      while (currentDate <= finalDate && iterationCount < maxIterations) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const result = resultMap.get(dateStr);

        growthData.push({
          label: `${months[currentDate.getMonth()]} ${day}`,
          year: currentDate.getFullYear(),
          count: result ? result.count : 0,
          period_number: currentDate.getDate(),
          date: dateStr
        });

        currentDate.setDate(currentDate.getDate() + 1);
        iterationCount++;
      }
    } else {
      // Monthly data
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endDateMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      let iterationCount = 0;
      const maxIterations = 50; // Safety limit for reasonable month ranges

      while (currentDate <= endDateMonth && iterationCount < maxIterations) {
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

    const currentPeriodBlogs = growthData[growthData.length - 1]?.count || 0;
    const lastPeriodBlogs = growthData[growthData.length - 2]?.count || 0;

    const response: BlogsGrowthResponse = {
      total_blogs: totalBlogs,
      growth_data: growthData,
      current_period_blogs: currentPeriodBlogs,
      last_period_blogs: lastPeriodBlogs,
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

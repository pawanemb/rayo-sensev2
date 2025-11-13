import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET endpoint to fetch blog data with limited fields
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('blogs');
    
    // Get blog posts with limited fields to avoid size issues
    const blogPosts = await collection.find({}, { 
      projection: { 
        _id: 1, 
        title: 1,
        project_id: 1,
        user_id: 1,
        created_at: 1,
        words_count: 1
      } 
    }).toArray();
    
    // Calculate monthly blog statistics
    const monthlyStats = calculateMonthlyStats(blogPosts);
    
    // Calculate top blog creators
    const topBlogCreators = calculateTopBlogCreators(blogPosts);
    
    // Return the response with limited data
    return NextResponse.json({
      success: true,
      data: {
        blogs_count: blogPosts.length,
        monthly_stats: monthlyStats,
        top_creators: topBlogCreators
      }
    });
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred while fetching blog data' 
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate monthly blog statistics
function calculateMonthlyStats(blogs: any[]) {
  const monthlyStats: Record<string, { month: string, count: number }> = {};
  
  blogs.forEach(blog => {
    if (blog.created_at) {
      const date = new Date(blog.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = {
          month: monthYear,
          count: 0
        };
      }
      
      monthlyStats[monthYear].count += 1;
    }
  });
  
  // Convert to array and sort by month
  return Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
}

// Helper function to calculate top blog creators based on user_id in the blog documents
function calculateTopBlogCreators(blogs: any[]) {
  const creatorStats: Record<string, { 
    user_id: string,
    count: number
  }> = {};
  
  blogs.forEach(blog => {
    // Use the blog's user_id if available
    const userId = blog.user_id || null;
    
    if (userId) {
      if (!creatorStats[userId]) {
        creatorStats[userId] = {
          user_id: userId,
          count: 0
        };
      }
      
      creatorStats[userId].count += 1;
    }
  });
  
  // Convert to array and sort by count (descending)
  const creators = Object.values(creatorStats).map(stat => {
    return {
      ...stat
    };
  });
  
  return creators.sort((a, b) => b.count - a.count).slice(0, 10); // Only return top 10
}

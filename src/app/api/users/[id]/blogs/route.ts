import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'rayo_db');
    
    // Get total count of blogs for this user
    const totalBlogs = await db.collection('blogs').countDocuments({
      user_id: resolvedParams.id
    });

    // Get paginated blogs
    const blogs = await db.collection('blogs')
      .find({ user_id: resolvedParams.id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({ 
      blogs: blogs.map(blog => ({
        ...blog,
        _id: blog._id.toString() // Convert ObjectId to string
      })),
      totalBlogs,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit)
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

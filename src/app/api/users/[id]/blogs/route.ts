import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    const includeProjects = searchParams.get('includeProjects') === 'true';

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

    // If includeProjects is true, fetch project details for all blogs
    let blogsWithProjects = blogs.map(blog => ({
      ...blog,
      _id: blog._id.toString()
    }));

    if (includeProjects) {
      // Get unique project IDs
      const projectIds = [...new Set(blogs.map(blog => blog.project_id).filter(Boolean))];

      if (projectIds.length > 0) {
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('id, name, url')
          .in('id', projectIds);

        // Create a map for quick lookup
        const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

        // Add project details to each blog
        blogsWithProjects = blogs.map(blog => ({
          ...blog,
          _id: blog._id.toString(),
          projectName: blog.project_id ? projectMap.get(blog.project_id)?.name || null : null,
          projectUrl: blog.project_id ? projectMap.get(blog.project_id)?.url || null : null
        }));
      }
    }

    return NextResponse.json({
      blogs: blogsWithProjects,
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

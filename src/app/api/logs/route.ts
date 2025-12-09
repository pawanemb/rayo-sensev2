import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseMonitoring } from "@/lib/supabase/monitoring";
import { supabaseAdmin } from "@/lib/supabase/admin";
import clientPromise from "@/lib/mongodb";

// Helper function to verify admin authentication using cookies
const verifyAdminAuth = async () => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Check if user has admin role
    const role = (
      user.user_metadata?.role ||
      user.app_metadata?.role ||
      ''
    ).toLowerCase();

    if (role !== 'admin' && role !== 'administrator') {
      return null;
    }

    return { user, id: user.id };
  } catch (error) {
    console.error('[LOGS] Auth verification error:', error);
    return null;
  }
};

// Helper function to enrich logs with user, project, and blog details
const enrichLogsWithDetails = async (logs: unknown[]) => {
  if (logs.length === 0) return logs;

  // Extract unique IDs
  const userIds = [...new Set(logs.map((log: unknown) => (log as { user_id?: string }).user_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(logs.map((log: unknown) => (log as { project_id?: string }).project_id).filter(Boolean))] as string[];
  const blogIds = [...new Set(logs.map((log: unknown) => (log as { blog_id?: string }).blog_id).filter(Boolean))] as string[];

  console.log(`[LOGS] Enriching logs - Users: ${userIds.length}, Projects: ${projectIds.length}, Blogs: ${blogIds.length}`);

  // Fetch user details from Supabase Auth
  const userDetails: Record<string, unknown> = {};
  if (userIds.length > 0) {
    try {
      const usersPromises = userIds.map(async (userId) => {
        try {
          const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (error || !userData) return { userId, user: null };
          return { userId, user: userData.user };
        } catch (error) {
          console.error(`[LOGS] Error fetching user ${userId}:`, error);
          return { userId, user: null };
        }
      });

      const userResults = await Promise.all(usersPromises);
      userResults.forEach(({ userId, user }) => {
        if (user) {
          userDetails[userId] = {
            id: user.id,
            email: user.email || 'Unknown',
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown',
            avatar: user.user_metadata?.avatar_url || null
          };
        }
      });
    } catch (error) {
      console.error('[LOGS] Error fetching user details:', error);
    }
  }

  // Fetch project details from Supabase
  const projectDetails: Record<string, unknown> = {};
  if (projectIds.length > 0) {
    try {
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('id, name, url, user_id')
        .in('id', projectIds);

      if (!error && projects) {
        projects.forEach((project) => {
          projectDetails[project.id] = project;
        });
      }
    } catch (error) {
      console.error('[LOGS] Error fetching project details:', error);
    }
  }

  // Fetch blog details from MongoDB
  const blogDetails: Record<string, unknown> = {};
  if (blogIds.length > 0) {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB_NAME);
      const blogsCollection = db.collection('blogs');
      const { ObjectId } = await import('mongodb');

      // Convert string IDs to ObjectId for MongoDB query
      const objectIds = blogIds
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch (error) {
            console.error(`[LOGS] Invalid blog ID format: ${id}`, error);
            return null;
          }
        })
        .filter((id): id is import('mongodb').ObjectId => id !== null);

      console.log(`[LOGS] Fetching ${objectIds.length} blogs from MongoDB`);

      const blogs = await blogsCollection
        .find(
          { _id: { $in: objectIds } },
          { projection: { _id: 1, title: 1, status: 1, word_count: 1 } }
        )
        .toArray();

      console.log(`[LOGS] Found ${blogs.length} blogs in MongoDB`);

      blogs.forEach((blog) => {
        const blogIdStr = blog._id.toString();
        blogDetails[blogIdStr] = {
          id: blogIdStr,
          title: Array.isArray(blog.title)
            ? (blog.title[blog.title.length - 1] || 'Untitled')
            : (blog.title || 'Untitled'),
          status: blog.status,
          word_count: blog.word_count
        };
        console.log(`[LOGS] Added blog details for blog ID: ${blogIdStr}`);
      });
    } catch (error) {
      console.error('[LOGS] Error fetching blog details:', error);
    }
  }

  // Enrich logs with fetched details
  return logs.map((log: unknown) => {
    const typedLog = log as Record<string, unknown> & { user_id?: string; project_id?: string; blog_id?: string };
    return {
      ...typedLog,
      user_details: typedLog.user_id ? (userDetails[typedLog.user_id] || null) : null,
      project_details: typedLog.project_id ? (projectDetails[typedLog.project_id] || null) : null,
      blog_details: typedLog.blog_id ? (blogDetails[typedLog.blog_id] || null) : null,
    };
  });
};

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const table = searchParams.get("table") || "scrape_requests";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Use monitoring Supabase client for logs data (separate database)
    // Fetch data based on table parameter
    if (table === "scrape_requests") {
      const { data, error, count } = await supabaseMonitoring
        .from("scrape_requests")
        .select("*", { count: "exact" })
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[LOGS] Error fetching scrape requests:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch scrape requests",
            detail: error.message,
            hint: error.hint
          },
          { status: 500 }
        );
      }

      // Enrich data with user, project, and blog details
      const enrichedData = await enrichLogsWithDetails(data || []);

      return NextResponse.json({
        data: enrichedData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    else if (table === "error_logs") {
      const { data, error, count } = await supabaseMonitoring
        .from("error_logs")
        .select("*", { count: "exact" })
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[LOGS] Error fetching error logs:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch error logs",
            detail: error.message,
            hint: error.hint
          },
          { status: 500 }
        );
      }

      // Enrich data with user, project, and blog details
      const enrichedData = await enrichLogsWithDetails(data || []);

      return NextResponse.json({
        data: enrichedData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    else if (table === "dashboard_summary") {
      const { data, error } = await supabaseMonitoring
        .from("dashboard_summary")
        .select("*")
        .single();

      if (error) {
        console.error("[LOGS] Error fetching dashboard summary:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch dashboard summary",
            data: null,
            detail: error.message,
            hint: error.hint
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { success: false, error: "Invalid table parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[LOGS] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

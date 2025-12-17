import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseMonitoring } from "@/lib/supabase/monitoring";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Get scraper API configuration from environment
const getScraperConfig = () => ({
  url: process.env.SCRAPER_URL || 'https://s.rayo.work',
  token: process.env.SCRAPER_TOKEN || 'rayo-scraper-pawan',
});

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
    console.error('[CRAWL] Auth verification error:', error);
    return null;
  }
};

// Helper function to enrich crawl tasks with user and project details
const enrichCrawlTasksWithDetails = async (tasks: unknown[]) => {
  if (tasks.length === 0) return tasks;

  // Extract unique IDs
  const userIds = [...new Set(tasks.map((task: unknown) => (task as { user_id?: string }).user_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(tasks.map((task: unknown) => (task as { project_id?: string }).project_id).filter(Boolean))] as string[];

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
          console.error(`[CRAWL] Error fetching user ${userId}:`, error);
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
      console.error('[CRAWL] Error fetching user details:', error);
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
      console.error('[CRAWL] Error fetching project details:', error);
    }
  }

  // Enrich tasks with fetched details
  return tasks.map((task: unknown) => {
    const typedTask = task as Record<string, unknown> & { user_id?: string; project_id?: string };
    return {
      ...typedTask,
      user_details: typedTask.user_id ? (userDetails[typedTask.user_id] || null) : null,
      project_details: typedTask.project_id ? (projectDetails[typedTask.project_id] || null) : null,
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
    const table = searchParams.get("table") || "crawl_tasks";
    const taskId = searchParams.get("task_id"); // For fetching pages of a specific task

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    if (table === "crawl_tasks") {
      const { data, error, count } = await supabaseMonitoring
        .from("crawl_tasks")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[CRAWL] Error fetching crawl tasks:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch crawl tasks",
            detail: error.message,
            hint: error.hint
          },
          { status: 500 }
        );
      }

      // Enrich data with user and project details
      const enrichedData = await enrichCrawlTasksWithDetails(data || []);

      return NextResponse.json({
        data: enrichedData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    else if (table === "crawl_pages") {
      let query = supabaseMonitoring
        .from("crawl_pages")
        .select("*", { count: "exact" })
        .order("crawled_at", { ascending: false });

      // Filter by task_id if provided
      if (taskId) {
        query = query.eq("task_id", taskId);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error("[CRAWL] Error fetching crawl pages:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch crawl pages",
            detail: error.message,
            hint: error.hint
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    else if (table === "crawl_summary") {
      // Get summary stats for crawl tasks
      const { data: tasks, error } = await supabaseMonitoring
        .from("crawl_tasks")
        .select("status, pages_crawled, pages_failed, urls_found, urls_queued");

      if (error) {
        console.error("[CRAWL] Error fetching crawl summary:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch crawl summary" },
          { status: 500 }
        );
      }

      const summary = {
        total_tasks: tasks?.length || 0,
        pending_tasks: tasks?.filter(t => t.status === 'pending').length || 0,
        running_tasks: tasks?.filter(t => t.status === 'running').length || 0,
        completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
        failed_tasks: tasks?.filter(t => t.status === 'failed').length || 0,
        total_pages_crawled: tasks?.reduce((sum, t) => sum + (t.pages_crawled || 0), 0) || 0,
        total_pages_failed: tasks?.reduce((sum, t) => sum + (t.pages_failed || 0), 0) || 0,
        total_urls_found: tasks?.reduce((sum, t) => sum + (t.urls_found || 0), 0) || 0,
        total_urls_queued: tasks?.reduce((sum, t) => sum + (t.urls_queued || 0), 0) || 0,
      };

      return NextResponse.json({ data: summary });
    }

    // Backend API calls (proxied to scraper service)
    else if (table === "task_status") {
      // Get task status from backend
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: "task_id is required" },
          { status: 400 }
        );
      }

      const { url: scraperUrl, token: scraperToken } = getScraperConfig();
      const response = await fetch(`${scraperUrl}/crawl/${taskId}/status`, {
        headers: { 'Authorization': `Bearer ${scraperToken}` },
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.detail || 'Failed to fetch task status' },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    else if (table === "backend_pages") {
      // Get pages from backend API
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: "task_id is required" },
          { status: 400 }
        );
      }

      const { url: scraperUrl, token: scraperToken } = getScraperConfig();
      const response = await fetch(
        `${scraperUrl}/crawl/${taskId}/pages?limit=${limit}&offset=${offset}`,
        { headers: { 'Authorization': `Bearer ${scraperToken}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.detail || 'Failed to fetch pages' },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    else if (table === "backend_tasks") {
      // Get tasks list from backend API
      const { url: scraperUrl, token: scraperToken } = getScraperConfig();
      const response = await fetch(
        `${scraperUrl}/crawl/tasks?limit=${limit}`,
        { headers: { 'Authorization': `Bearer ${scraperToken}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.detail || 'Failed to fetch tasks' },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    else if (table === "cache_stats") {
      // Get cache statistics from backend
      const { url: scraperUrl, token: scraperToken } = getScraperConfig();
      const response = await fetch(
        `${scraperUrl}/cache/stats`,
        { headers: { 'Authorization': `Bearer ${scraperToken}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.detail || 'Failed to fetch cache stats' },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: "Invalid table parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[CRAWL] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handler for starting and canceling crawl tasks
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();

  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action, task_id, seed_url, max_pages, use_proxy, respect_robots } = body;

    const { url: scraperUrl, token: scraperToken } = getScraperConfig();

    // Start a new crawl task
    if (action === "start") {
      if (!seed_url) {
        return NextResponse.json(
          { success: false, error: "seed_url is required" },
          { status: 400 }
        );
      }

      console.log("[CRAWL] Starting new crawl task:", seed_url);

      const response = await fetch(`${scraperUrl}/crawl/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scraperToken}`,
        },
        body: JSON.stringify({
          seed_url,
          max_pages: max_pages || 100,
          use_proxy: use_proxy ?? true,
          respect_robots: respect_robots ?? true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[CRAWL] Start crawl error:", {
          status: response.status,
          data
        });
        return NextResponse.json(
          {
            success: false,
            error: data.detail || 'Failed to start crawl',
            details: data
          },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Crawl task started",
        data
      });
    }

    // Cancel an existing crawl task
    if (action === "cancel") {
      if (!task_id) {
        return NextResponse.json(
          { success: false, error: "task_id is required" },
          { status: 400 }
        );
      }

      console.log("[CRAWL] Canceling crawl task:", task_id);

      const response = await fetch(`${scraperUrl}/crawl/${task_id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${scraperToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[CRAWL] Cancel crawl error:", {
          status: response.status,
          data
        });
        return NextResponse.json(
          {
            success: false,
            error: data.detail || 'Failed to cancel crawl',
            details: data
          },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Crawl task canceled",
        data
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'start' or 'cancel'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[CRAWL] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE handler for cache operations
export async function DELETE(request: NextRequest) {
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
    const action = searchParams.get("action");
    const url = searchParams.get("url");

    const { url: scraperUrl, token: scraperToken } = getScraperConfig();

    // Delete cache for specific URL
    if (action === "cache_url") {
      if (!url) {
        return NextResponse.json(
          { success: false, error: "url parameter is required" },
          { status: 400 }
        );
      }

      console.log("[CRAWL] Deleting cache for URL:", url);

      const response = await fetch(
        `${scraperUrl}/cache/url?url=${encodeURIComponent(url)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${scraperToken}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.detail || 'Failed to delete cache' },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Cache deleted for URL",
        data
      });
    }

    // Clear all cache
    if (action === "cache_clear") {
      console.log("[CRAWL] Clearing all cache");

      const response = await fetch(
        `${scraperUrl}/cache/clear`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${scraperToken}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.detail || 'Failed to clear cache' },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All cache cleared",
        data
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'cache_url' or 'cache_clear'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[CRAWL] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

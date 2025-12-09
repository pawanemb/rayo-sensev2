import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireAdmin } from "@/lib/auth/requireAdmin";
import { normalizeUser } from "@/lib/users/transform";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_PER_PAGE = 12; // Good for image galleries (3x4 grid)
const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(MAX_PER_PAGE, Number(searchParams.get("limit")) || DEFAULT_PER_PAGE);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const projectId = searchParams.get("projectId") || "";
    const userId = searchParams.get("userId") || "";
    const category = searchParams.get("category") || "";

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabaseAdmin
      .from('project_images')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (search) {
      query = query.or(`original_filename.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Add filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Only show active images by default
    query = query.eq('is_active', true);

    // Apply pagination and sorting (newest first)
    const { data: images, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch images: ${error.message}`);
    }

    // Get total count
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Get unique project IDs and user IDs
    const projectIds = [...new Set((images || []).map(img => img.project_id).filter(Boolean))];
    const userIds = [...new Set((images || []).map(img => img.user_id).filter(Boolean))];

    // Fetch projects data
    const projectsMap = new Map();
    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('id, name, url')
        .in('id', projectIds);

      if (!projectsError && projects) {
        projects.forEach(project => {
          projectsMap.set(project.id, {
            name: project.name,
            url: project.url,
          });
        });
      }
    }

    // Fetch user data from Supabase Auth
    const usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

      if (!usersError && users) {
        users.users.forEach(user => {
          if (userIds.includes(user.id)) {
            const normalized = normalizeUser(user);
            usersMap.set(user.id, {
              id: normalized.id,
              name: normalized.name,
              email: normalized.email || '',
              avatar: normalized.avatar,
            });
          }
        });
      }
    }

    // Attach project and user data to images
    const imagesWithDetails = (images || []).map(image => ({
      ...image,
      project: projectsMap.get(image.project_id) || null,
      user: usersMap.get(image.user_id) || null,
    }));

    return NextResponse.json({
      images: imagesWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    return handleApiError(error);
  }
}

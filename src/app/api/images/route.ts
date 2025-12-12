import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_PER_PAGE = 12; // Good for image galleries (3x4 grid)
const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(MAX_PER_PAGE, Number(searchParams.get("limit")) || DEFAULT_PER_PAGE);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const projectId = searchParams.get("projectId") || "";
    const userId = searchParams.get("userId") || "";
    const category = searchParams.get("category") || "";

    // Build query
    let query = supabaseAdmin
      .from('project_images')
      .select('*', { count: 'exact' });

    // Add filters (but NOT search - we'll filter after joining)
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

    // Apply sorting (newest first)
    // When searching, fetch ALL records to filter by joined data (project, user)
    // Otherwise use pagination at database level
    query = query.order('created_at', { ascending: false });

    let images: any, error: any, count: any;
    if (search) {
      // Fetch all records when searching in batches (we'll filter and paginate in JS)
      console.log('[IMAGES] Fetching all images for search...');
      images = [];
      let currentOffset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const batchQuery = query.range(currentOffset, currentOffset + batchSize - 1);
        const result = await batchQuery;

        if (result.error) {
          error = result.error;
          break;
        }

        if (result.data && result.data.length > 0) {
          images = [...images, ...result.data];
          console.log(`[IMAGES] Batch fetched: ${result.data.length} (Total: ${images.length})`);
          currentOffset += batchSize;

          if (result.data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        // Store count from first batch
        if (currentOffset === batchSize && result.count !== null) {
          count = result.count;
        }
      }

      console.log('[IMAGES] Total images fetched for search:', images.length);
    } else {
      // Use database-level pagination when not searching
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const result = await query.range(from, to);
      images = result.data;
      error = result.error;
      count = result.count;
    }

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch images: ${error.message}`);
    }

    // Get unique project IDs and user IDs
    const projectIds = [...new Set((images || []).map((img: any) => img.project_id).filter(Boolean))];
    const userIds = [...new Set((images || []).map((img: any) => img.user_id).filter(Boolean))] as string[];

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

    // Fetch user data from Supabase Auth - fetch individually for reliability
    const usersMap = new Map();
    if (userIds.length > 0) {
      const usersPromises = userIds.map(async (userId) => {
        try {
          const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (error || !userData) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
          }
          return userData.user;
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return null;
        }
      });

      const userResults = await Promise.all(usersPromises);
      const allUsers = userResults.filter(user => user !== null);

      allUsers.forEach(user => {
        if (user && user.id) {
          usersMap.set(user.id, {
            id: user.id,
            email: user.email || 'Unknown',
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown',
            avatar: user.user_metadata?.avatar_url || null
          });
        }
      });
    }

    // Attach project and user data to images
    let imagesWithDetails = (images || []).map((image: any) => ({
      ...image,
      project: projectsMap.get(image.project_id) || null,
      user: usersMap.get(image.user_id) || null,
    }));

    // If search term exists, filter by ALL fields including joined data
    if (search) {
      imagesWithDetails = imagesWithDetails.filter((image: any) => {
        const searchLower = search.toLowerCase();

        // Check project fields
        const projectMatch = image.project && (
          image.project.name.toLowerCase().includes(searchLower) ||
          image.project.url.toLowerCase().includes(searchLower)
        );

        // Check user fields
        const userMatch = image.user && (
          (image.user.name && image.user.name.toLowerCase().includes(searchLower)) ||
          image.user.email.toLowerCase().includes(searchLower)
        );

        // Check image fields
        const imageMatch =
          image.original_filename.toLowerCase().includes(searchLower) ||
          (image.description && image.description.toLowerCase().includes(searchLower)) ||
          (image.category && image.category.toLowerCase().includes(searchLower));

        return projectMatch || userMatch || imageMatch;
      });

      // Calculate pagination after filtering
      const total = imagesWithDetails.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const from = (page - 1) * limit;
      const to = from + limit;

      // Apply pagination to filtered results
      const paginatedImages = imagesWithDetails.slice(from, to);

      return NextResponse.json({
        images: paginatedImages,
        pagination: {
          currentPage: page,
          totalPages,
          total,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    }

    // No search - return paginated results from database
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

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
    console.error('[IMAGES] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

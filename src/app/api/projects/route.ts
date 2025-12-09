import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(MAX_PER_PAGE, Number(searchParams.get("limit")) || DEFAULT_PER_PAGE);
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,url.ilike.%${search}%`);
    }

    // Apply pagination and sorting
    const { data: projects, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Get total count
    const totalProjects = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalProjects / limit));

    // Get unique user IDs
    const userIds = [...new Set((projects || []).map(p => p.user_id).filter(Boolean))];

    // Fetch user data from Supabase - fetch individually for reliability
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

    // Get GSC connection status for all projects
    const projectIds = (projects || []).map(p => p.id);
    const gscMap = new Map();
    
    if (projectIds.length > 0) {
      const { data: gscAccounts } = await supabaseAdmin
        .from('gsc_accounts')
        .select('project_id')
        .in('project_id', projectIds);
      
      if (gscAccounts) {
        gscAccounts.forEach(account => {
          gscMap.set(account.project_id, true);
        });
      }
    }

    // Attach user data and GSC status to projects
    const projectsWithUsers = (projects || []).map(project => ({
      id: project.id,
      name: project.name,
      url: project.url,
      brand_name: project.brand_name || null,
      services: project.services || [],
      industries: project.industries || [],
      gender: project.gender,
      languages: project.languages || [],
      age_groups: project.age_groups || [],
      locations: project.locations || [],
      business_type: project.business_type || null,
      is_active: project.is_active,
      visitors: project.visitors || 0,
      created_at: project.created_at,
      updated_at: project.updated_at || null,
      user_id: project.user_id,
      cms_config: project.cms_config || null,
      gsc_connected: gscMap.get(project.id) || false,
      user: usersMap.get(project.user_id) || null,
    }));

    return NextResponse.json({
      projects: projectsWithUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalProjects,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

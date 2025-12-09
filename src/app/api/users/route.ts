import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeUser } from "@/lib/users/transform";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

// Cache for total user count (expires after 5 minutes)
let cachedTotalUsers: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getTotalUserCount(): Promise<number> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedTotalUsers !== null && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedTotalUsers;
  }

  // Fetch total count by making a single request with a large perPage
  // This is more efficient than fetching all users
  let total = 0;
  let page = 1;
  const perPage = 1000; // Max allowed by Supabase
  
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    
    if (error) throw error;
    
    const count = data?.users?.length ?? 0;
    total += count;
    
    // If we got less than perPage, we've reached the end
    if (count < perPage) {
      break;
    }
    
    page++;
    
    // Safety limit to prevent infinite loops
    if (page > 100) {
      break;
    }
  }
  
  // Update cache
  cachedTotalUsers = total;
  cacheTimestamp = now;
  
  return total;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(MAX_PER_PAGE, Number(searchParams.get("perPage")) || DEFAULT_PER_PAGE);
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // If search is provided, we need to fetch all users and filter
    if (search) {
      // Fetch all users for search
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allUsers: any[] = [];
      let currentPage = 1;
      const fetchPerPage = 1000;
      
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page: currentPage,
          perPage: fetchPerPage,
        });
        
        if (error) throw error;
        
        const users = data?.users ?? [];
        allUsers.push(...users);
        
        if (users.length < fetchPerPage) {
          break;
        }
        
        currentPage++;
        
        // Safety limit
        if (currentPage > 100) {
          break;
        }
      }
      
      // Filter users based on search
      const filteredUsers = allUsers.filter((user) => {
        const meta = (user.user_metadata as Record<string, unknown>) || {};
        const name =
          (typeof meta.full_name === "string" && meta.full_name.toLowerCase()) ||
          (typeof meta.name === "string" && meta.name.toLowerCase()) ||
          "";
        return (
          (user.email && user.email.toLowerCase().includes(search)) ||
          name.includes(search) ||
          user.id?.toLowerCase().includes(search)
        );
      });
      
      // Paginate filtered results
      const total = filteredUsers.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const start = (page - 1) * perPage;
      const paginatedUsers = filteredUsers.slice(start, start + perPage);
      
      // Normalize users
      const normalizedUsers = paginatedUsers.map(normalizeUser);
      
      return NextResponse.json({
        users: normalizedUsers,
        pagination: {
          total,
          page,
          perPage,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    }

    // No search - use cached total count and fetch only requested page
    const totalUsers = await getTotalUserCount();

    // Fetch only the requested page from Supabase
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const users = data?.users ?? [];

    // Normalize users
    const normalizedUsers = users.map(normalizeUser);

    // Calculate pagination info
    const totalPages = Math.max(1, Math.ceil(totalUsers / perPage));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users: normalizedUsers,
      pagination: {
        total: totalUsers,
        page,
        perPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, metadata = {}, appMetadata = {} } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: appMetadata,
    });

    if (error) throw error;

    return NextResponse.json({ user: normalizeUser(data.user) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

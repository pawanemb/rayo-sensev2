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

    // Calculate pagination offsets
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabaseAdmin
      .from('authorized_users')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Apply pagination and sorting
    const { data: authorizedUsers, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[AUTHORIZED-USERS-LIST] Supabase error:', error);
      throw new Error(`Failed to fetch authorized users: ${error.message}`);
    }

    // Fetch user details for linked users
    const userIds = (authorizedUsers || [])
      .filter(u => u.user_id)
      .map(u => u.user_id);

    const userMap = new Map<string, { name: string; avatar: string }>();

    if (userIds.length > 0) {
      // Fetch users from Supabase Auth
      for (const userId of userIds) {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (userData?.user) {
            const name = userData.user.user_metadata?.full_name ||
                        userData.user.user_metadata?.name ||
                        userData.user.email?.split('@')[0] || 'User';
            const avatar = userData.user.user_metadata?.avatar_url || '';
            userMap.set(userId, { name, avatar });
          }
        } catch {
          // Skip if user not found
        }
      }
    }

    // Attach user info to authorized users
    const enrichedUsers = (authorizedUsers || []).map(u => ({
      ...u,
      user_name: u.user_id ? userMap.get(u.user_id)?.name || null : null,
      user_avatar: u.user_id ? userMap.get(u.user_id)?.avatar || null : null,
    }));

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      authorizedUsers: enrichedUsers,
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
    console.error('[AUTHORIZED-USERS-LIST] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, company_name, user_id } = body;

    // Validate required fields
    if (!email || !company_name) {
      return NextResponse.json(
        { error: "Email and company name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('authorized_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists in authorized users" },
        { status: 409 }
      );
    }

    // Create new authorized user
    const { data, error } = await supabaseAdmin
      .from('authorized_users')
      .insert({
        email: email.toLowerCase(),
        company_name: company_name.trim(),
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[AUTHORIZED-USERS-CREATE] Supabase error:', error);
      throw new Error(`Failed to create authorized user: ${error.message}`);
    }

    return NextResponse.json({ authorizedUser: data }, { status: 201 });
  } catch (error) {
    console.error('[AUTHORIZED-USERS-CREATE] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

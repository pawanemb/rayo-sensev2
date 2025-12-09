import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserAvatar } from '@/lib/users/avatar';
import type { User } from '@supabase/supabase-js';
interface ActiveUser {
  user_id: string;
  user_email: string;
  name: string;
  last_activity: string;
  provider: string;
  avatar: string;
  is_active: boolean; // true if last activity was within 5 minutes
  raw: User; // Full raw user object from Supabase
}
interface ActiveUsersResponse {
  active_users: ActiveUser[];
  total_count: number;
  query_window_hours: number;
  active_window_minutes: number;
}
export async function GET() {
  try {
    // Verify admin authentication
    // Calculate timestamps
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // Last 5 minutes
    // Query user_activity table for last 24 hours
    const { data: activities, error } = await supabaseAdmin
      .from('user_activity')
      .select('user_id, user_email, name, created_at, provider')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[ACTIVE-USERS] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch active users from database.' },
        { status: 500 }
      );
    }
    // Get UNIQUE users from the activities and find their most recent activity
    const uniqueUserMap = new Map<string, {
      user_id: string;
      user_email: string;
      name: string;
      last_activity: string;
      provider: string;
    }>();
    // Loop through activities and keep only the most recent per user
    (activities || []).forEach((activity) => {
      if (!uniqueUserMap.has(activity.user_id)) {
        uniqueUserMap.set(activity.user_id, {
          user_id: activity.user_id,
          user_email: activity.user_email || 'Unknown',
          name: activity.name || 'Unknown User',
          last_activity: activity.created_at,
          provider: activity.provider || 'unknown',
        });
      }
    });
    // Fetch all users to get avatars and raw user objects
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    // Create a map of user_id to avatar and raw user object
    const userDataMap = new Map<string, { avatar: string; raw: User }>();
    if (!usersError && users && users.users) {
      users.users.forEach((user) => {
        // Check both avatar_url and picture fields (same as UserList)
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const avatar = getUserAvatar(user.id, avatarUrl);
        userDataMap.set(user.id, { avatar, raw: user });
      });
    }
    // Map ALL users from 24 hours, mark those active in last 5 min
    const allUsers: ActiveUser[] = Array.from(uniqueUserMap.values()).map((user) => {
      // Parse timestamp properly - ensure UTC by adding 'Z' if not present
      const timestamp = user.last_activity.endsWith('Z') ? user.last_activity : user.last_activity + 'Z';
      const lastActivityTime = new Date(timestamp);
      const isActiveInLast5Min = lastActivityTime >= fiveMinutesAgo;
      // Get user data from map (avatar + raw user object)
      const userData = userDataMap.get(user.user_id);
      const avatar = userData?.avatar || getUserAvatar(user.user_id);
      // Create a minimal raw user object if not found (should not happen normally)
      const raw = userData?.raw || ({
        id: user.user_id,
        email: user.user_email,
        user_metadata: { full_name: user.name },
        app_metadata: { provider: user.provider },
      } as unknown as User);
      return {
        ...user,
        avatar,
        is_active: isActiveInLast5Min,
        raw
      };
    });
    const response: ActiveUsersResponse = {
      active_users: allUsers,
      total_count: allUsers.length,
      query_window_hours: 24,
      active_window_minutes: 5
    };
    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('[ACTIVE-USERS] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while fetching active users.' },
      { status: 500 }
    );
  }
}

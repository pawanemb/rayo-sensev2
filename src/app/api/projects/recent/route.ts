import { NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Verify admin authentication
    await requireAdmin();

    console.log('📊 Fetching recent projects...');

    // Fetch latest 10 projects
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, user_id, name, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects.' },
        { status: 500 }
      );
    }

    // Fetch user details for each project
    const projectsWithUsers = await Promise.all(
      (projects || []).map(async (project) => {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(project.user_id);

        if (userError) {
          console.error(`Error fetching user ${project.user_id}:`, userError);
        }

        return {
          id: project.id,
          user_id: project.user_id,
          user_email: userData?.user?.email || 'Unknown',
          user_name: userData?.user?.user_metadata?.name || 'Unknown',
          user_avatar: userData?.user?.user_metadata?.avatar_url || userData?.user?.user_metadata?.picture || null,
          title: project.name,
          status: project.is_active ? 'Active' : 'Inactive',
          created_at: project.created_at,
        };
      })
    );

    console.log(`✅ Found ${projectsWithUsers.length} recent projects`);

    return NextResponse.json({
      success: true,
      projects: projectsWithUsers,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

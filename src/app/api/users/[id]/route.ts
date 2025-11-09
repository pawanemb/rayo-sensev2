import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleApiError, requireAdmin } from "@/lib/auth/requireAdmin";
import { normalizeUser } from "@/lib/users/transform";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    
    // Get user from auth
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(
      resolvedParams.id
    );
    if (error) throw error;
    if (!data?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get additional user information from user_information table
    const { data: userInfo, error: userInfoError } = await supabaseAdmin
      .from('user_information')
      .select('*')
      .eq('user_id', resolvedParams.id)
      .single();

    // Get account/billing information from accounts table
    const { data: accountInfo, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', resolvedParams.id)
      .single();

    // Get total count of user's projects
    const { count: totalProjects } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolvedParams.id);

    // Get user's projects from projects table (first 5 for initial load)
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', resolvedParams.id)
      .order('created_at', { ascending: false })
      .range(0, 4); // First 5 projects

    // Get GSC connection status for projects
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

    // Attach GSC status to projects
    const projectsWithGSC = (projects || []).map(project => ({
      ...project,
      gsc_connected: gscMap.get(project.id) || false,
    }));

    // Don't throw error if tables don't exist, just return null
    const additionalInfo = userInfoError ? null : userInfo;
    const billingInfo = accountError ? null : accountInfo;
    const projectsInfo = projectsError ? [] : projectsWithGSC;

    return NextResponse.json({ 
      user: normalizeUser(data.user),
      userInformation: additionalInfo,
      accountInformation: billingInfo,
      projects: projectsInfo,
      totalProjects: totalProjects || 0
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { email, password, metadata, appMetadata } = body;

    const resolvedParams = await params;
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      resolvedParams.id,
      {
        email,
        password,
        user_metadata: metadata,
        app_metadata: appMetadata,
      }
    );

    if (error) throw error;

    return NextResponse.json({ user: normalizeUser(data.user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(resolvedParams.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

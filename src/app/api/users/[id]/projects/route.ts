import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    
    const start = parseInt(searchParams.get('start') || '0');
    const end = parseInt(searchParams.get('end') || '9');

    // Get user's projects from projects table with pagination
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', resolvedParams.id)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (projectsError) throw projectsError;

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

    // Attach GSC status to projects
    const projectsWithGSC = (projects || []).map(project => ({
      ...project,
      gsc_connected: gscMap.get(project.id) || false,
    }));

    return NextResponse.json({ 
      projects: projectsWithGSC
    });
  } catch (error) {
    return handleApiError(error);
  }
}

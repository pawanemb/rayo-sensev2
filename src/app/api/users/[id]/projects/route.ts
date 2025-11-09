import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleApiError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
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

    return NextResponse.json({ 
      projects: projects || []
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { is_active } = await request.json();

    // Update project status
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update project status: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      project: data,
      message: `Project ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('[PROJECT-STATUS] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: authorizedUser, error } = await supabaseAdmin
      .from('authorized_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !authorizedUser) {
      return NextResponse.json(
        { error: 'Authorized user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ authorizedUser });
  } catch (error) {
    console.error('[AUTHORIZED-USER-GET] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if record exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('authorized_users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Authorized user not found' },
        { status: 404 }
      );
    }

    // Delete the record
    const { error } = await supabaseAdmin
      .from('authorized_users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[AUTHORIZED-USER-DELETE] Supabase error:', error);
      throw new Error(`Failed to delete authorized user: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTHORIZED-USER-DELETE] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

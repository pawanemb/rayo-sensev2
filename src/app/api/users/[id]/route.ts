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
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(
      resolvedParams.id
    );
    if (error) throw error;
    if (!data?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: normalizeUser(data.user) });
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

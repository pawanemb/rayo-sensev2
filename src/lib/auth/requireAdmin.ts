import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export class AdminAccessError extends Error {
  status: number;
  constructor(message = "Admin access required", status = 401) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAccessError("Authentication required", 401);
  }

  const role = (user.user_metadata?.role || user.app_metadata?.role || "").toLowerCase();
  if (role !== "admin") {
    throw new AdminAccessError("Admin access required", 403);
  }

  return user;
}

export function handleApiError(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

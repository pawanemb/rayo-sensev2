import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabaseAdmin
      .from('usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolvedParams.id);

    // Get paginated usage records
    // If limit is very high (for export), fetch all records
    let usageQuery = supabaseAdmin
      .from('usage')
      .select('*, projects(name, url)')
      .eq('user_id', resolvedParams.id)
      .order('created_at', { ascending: false });

    // Only apply range if limit is reasonable
    if (limit < 10000) {
      usageQuery = usageQuery.range(offset, offset + limit - 1);
    }

    const { data: usage, error } = await usageQuery;

    if (error) {
      console.error('Error fetching usage:', error);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    // Get totals for all records (not just current page)
    const { data: allUsage } = await supabaseAdmin
      .from('usage')
      .select('base_cost, actual_charge')
      .eq('user_id', resolvedParams.id);

    const totalBaseCost = allUsage?.reduce((sum, record) => sum + (record.base_cost || 0), 0) || 0;
    const totalActualCharge = allUsage?.reduce((sum, record) => sum + (record.actual_charge || 0), 0) || 0;

    return NextResponse.json({ 
      usage: usage || [],
      totalUsage: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      totalBaseCost,
      totalActualCharge
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

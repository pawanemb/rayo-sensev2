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

    console.log('============ USAGE API REQUEST ============');
    console.log('User ID:', resolvedParams.id);
    console.log('Page:', page, '| Limit:', limit, '| Offset:', offset);

    // Get total count
    const { count } = await supabaseAdmin
      .from('usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolvedParams.id);

    console.log('Total usage records in database:', count);

    // Get paginated usage records
    // If limit is very high (for export), fetch ALL records in batches
    let usage: any[] = [];
    let error = null;

    if (limit >= 10000) {
      console.log('Fetching ALL records (no limit) for export using batch fetching...');

      // Fetch all records in batches of 1000 to avoid Supabase limits
      let currentOffset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error: batchError } = await supabaseAdmin
          .from('usage')
          .select('*, projects(name, url)')
          .eq('user_id', resolvedParams.id)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + batchSize - 1);

        if (batchError) {
          error = batchError;
          break;
        }

        if (batchData && batchData.length > 0) {
          usage = [...usage, ...batchData];
          console.log(`Batch fetched: ${batchData.length} records (Total so far: ${usage.length})`);
          currentOffset += batchSize;

          // If we got fewer records than batchSize, we've reached the end
          if (batchData.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Total records fetched for export: ${usage.length}`);
    } else {
      console.log('Applying pagination range:', offset, 'to', offset + limit - 1);
      const result = await supabaseAdmin
        .from('usage')
        .select('*, projects(name, url)')
        .eq('user_id', resolvedParams.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      usage = result.data || [];
      error = result.error;
    }

    console.log('Records fetched:', usage?.length || 0);

    if (error) {
      console.error('Error fetching usage:', error);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    // Get totals for all records (not just current page)
    // Fetch ALL records in batches to avoid 1000 row limit
    console.log('Fetching ALL records for total cost calculation...');
    let allUsage: any[] = [];
    let currentBatchOffset = 0;
    const batchSize = 1000;
    let hasMoreBatches = true;

    while (hasMoreBatches) {
      const { data: batchData, error: batchError } = await supabaseAdmin
        .from('usage')
        .select('base_cost, actual_charge')
        .eq('user_id', resolvedParams.id)
        .range(currentBatchOffset, currentBatchOffset + batchSize - 1);

      if (batchError) {
        console.error('Error fetching batch for totals:', batchError);
        break;
      }

      if (batchData && batchData.length > 0) {
        allUsage = [...allUsage, ...batchData];
        console.log(`Totals batch: ${batchData.length} records (Total: ${allUsage.length})`);
        currentBatchOffset += batchSize;

        if (batchData.length < batchSize) {
          hasMoreBatches = false;
        }
      } else {
        hasMoreBatches = false;
      }
    }

    console.log('Records fetched for totals calculation:', allUsage.length);

    const totalBaseCost = allUsage.reduce((sum, record) => sum + (record.base_cost || 0), 0) || 0;
    const totalActualCharge = allUsage.reduce((sum, record) => sum + (record.actual_charge || 0), 0) || 0;

    console.log('Calculated Total Base Cost:', totalBaseCost);
    console.log('Calculated Total Actual Charge:', totalActualCharge);
    console.log('Sample of first 3 records:');
    allUsage.slice(0, 3).forEach((record, idx) => {
      console.log(`  Record ${idx + 1}: base_cost=${record.base_cost}, actual_charge=${record.actual_charge}`);
    });
    console.log('==========================================\n');

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

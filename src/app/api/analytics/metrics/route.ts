import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Verify admin authentication
    await requireAdmin();

    console.log('📊 Fetching dashboard metrics...');

    // Fetch total users count
    let totalUsers = 0;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error('❌ Error fetching users:', error);
        break;
      }

      const count = data?.users?.length ?? 0;
      totalUsers += count;

      if (count < perPage) break;
      page++;
    }

    console.log(`👥 Total users: ${totalUsers}`);

    // Fetch free users count
    const { count: freeUsersCount, error: freeUsersError } = await supabaseAdmin
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('plan_type', 'free');

    if (freeUsersError) {
      console.error('❌ Error fetching free users:', freeUsersError);
    }

    // Fetch pro users count
    const { count: proUsersCount, error: proUsersError } = await supabaseAdmin
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('plan_type', 'pro');

    if (proUsersError) {
      console.error('❌ Error fetching pro users:', proUsersError);
    }

    console.log(`🆓 Free users: ${freeUsersCount || 0}`);
    console.log(`⭐ Pro users: ${proUsersCount || 0}`);

    // Fetch total captured payments count and sum
    const { data: capturedPayments, error: paymentsError } = await supabaseAdmin
      .from('razorpay_payments')
      .select('amount, currency')
      .eq('status', 'captured');

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
    }

    const capturedPaymentsCount = capturedPayments?.length || 0;
    const totalAmount = capturedPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    console.log(`💰 Total captured payments: ${capturedPaymentsCount}`);
    console.log(`💵 Total payment amount: ${totalAmount / 100}`);

    return NextResponse.json({
      success: true,
      data: {
        total_users: totalUsers,
        free_users: freeUsersCount || 0,
        pro_users: proUsersCount || 0,
        total_payments: capturedPaymentsCount,
        total_amount: totalAmount,
      },
    });

  } catch (error) {
    console.error('❌ Metrics API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

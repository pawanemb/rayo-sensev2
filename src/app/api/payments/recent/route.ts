import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Verify admin authentication

    console.log('📊 Fetching recent payments...');

    // Fetch recent payments (last 50, all statuses)
    const { data: payments, error } = await supabaseAdmin
      .from('razorpay_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Fetch user details for each payment
    const paymentsWithUsers = await Promise.all(
      (payments || []).map(async (payment) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);

        return {
          id: payment.id,
          user_id: payment.user_id,
          user_email: userData?.user?.email || 'Unknown',
          user_name: userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || 'Unknown',
          user_avatar: userData?.user?.user_metadata?.avatar_url || userData?.user?.user_metadata?.picture || null,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          razorpay_payment_id: payment.razorpay_payment_id,
          created_at: payment.created_at,
          description: payment.description,
        };
      })
    );

    console.log(`✅ Found ${paymentsWithUsers.length} recent payments`);

    return NextResponse.json({
      success: true,
      payments: paymentsWithUsers,
    });

  } catch (error) {
    console.error('❌ Recent Payments API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Verify admin authentication

    console.log('📊 Fetching recent blogs...');

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const blogsCollection = db.collection('blogs');

    // Fetch latest 10 blogs
    const blogs = await blogsCollection
      .find({})
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    console.log(`📝 Found ${blogs.length} recent blogs`);

    // Fetch user details for each blog
    const blogsWithUsers = await Promise.all(
      blogs.map(async (blog) => {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(blog.user_id);

        if (userError) {
          console.error(`Error fetching user ${blog.user_id}:`, userError);
        }

        return {
          id: blog._id.toString(),
          user_id: blog.user_id,
          user_email: userData?.user?.email || 'Unknown',
          user_name: userData?.user?.user_metadata?.name || 'Unknown',
          user_avatar: userData?.user?.user_metadata?.avatar_url || userData?.user?.user_metadata?.picture || null,
          title: blog.title || 'Untitled',
          status: blog.status || 'draft',
          created_at: blog.created_at,
        };
      })
    );

    console.log(`✅ Processed ${blogsWithUsers.length} blogs with user data`);

    return NextResponse.json({
      success: true,
      blogs: blogsWithUsers,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

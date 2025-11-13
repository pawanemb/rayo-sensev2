import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ObjectId } from 'mongodb';
import cache from '@/lib/cache';

// Helper function to verify authentication
const verifyAuth = async (request: NextRequest) => {
  const token = request.cookies.get('supabase-auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    
    // Check if user is admin
    const userRole = data.user.app_metadata?.role?.toLowerCase() || '';
    const isAdmin = userRole === 'admin' || userRole === 'administrator';
    if (!isAdmin) return null;
    
    return { user: data.user, token, id: data.user.id };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[BLOG/DELETE] Delete request for blog ID: ${params.id}`);
  
  // Verify authentication and admin role
  const auth = await verifyAuth(request);
  if (!auth) {
    console.log(`[BLOG/DELETE] Authentication failed`);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = params;

  // Validate blog ID
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Blog ID is required' },
      { status: 400 }
    );
  }

  // Validate MongoDB ObjectId format
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid blog ID format' },
      { status: 400 }
    );
  }

  try {
    console.log(`[BLOG/DELETE] Connecting to MongoDB...`);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('blogs');

    // Check if blog exists and is currently active
    const existingBlog = await collection.findOne({ 
      _id: new ObjectId(id)
    });

    if (!existingBlog) {
      console.log(`[BLOG/DELETE] Blog not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if already deleted
    if (existingBlog.is_active === false) {
      console.log(`[BLOG/DELETE] Blog already deleted: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Blog is already deleted' },
        { status: 400 }
      );
    }

    // Perform soft delete by setting is_active to false
    console.log(`[BLOG/DELETE] Soft deleting blog: ${id}`);
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          is_active: false,
          deleted_at: new Date(),
          deleted_by: auth.id
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      console.error(`[BLOG/DELETE] Blog not found during update: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    if (updateResult.modifiedCount === 0) {
      console.error(`[BLOG/DELETE] Blog update failed: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Failed to delete blog' },
        { status: 500 }
      );
    }

    console.log(`[BLOG/DELETE] Successfully soft deleted blog: ${id}`);

    // Invalidate blog-related cache
    cache.invalidatePattern('blogs:');
    console.log(`[BLOG/DELETE] Invalidated blog cache after deletion`);

    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully',
      blog_id: id,
      deleted_at: new Date().toISOString(),
      deleted_by: auth.id
    });

  } catch (error) {
    console.error('[BLOG/DELETE] Error deleting blog:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete blog' 
      },
      { status: 500 }
    );
  }
}

// Alternative DELETE method (some clients prefer DELETE over POST)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return POST(request, { params });
}
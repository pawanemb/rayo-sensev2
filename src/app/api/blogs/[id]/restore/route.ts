import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ObjectId } from 'mongodb';

// Helper function to verify authentication
const verifyAuth = async (request: NextRequest) => {
  const token = request.cookies.get('_auth')?.value;
  
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
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log(`[BLOG/RESTORE] Restore request for blog ID: ${resolvedParams.id}`);

  // Verify authentication and admin role
  const auth = await verifyAuth(request);
  if (!auth) {
    console.log(`[BLOG/RESTORE] Authentication failed`);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = resolvedParams;

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
    console.log(`[BLOG/RESTORE] Connecting to MongoDB...`);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('blogs');

    // Check if blog exists and is currently deleted
    const existingBlog = await collection.findOne({ 
      _id: new ObjectId(id)
    });

    if (!existingBlog) {
      console.log(`[BLOG/RESTORE] Blog not found: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if already active
    if (existingBlog.is_active !== false) {
      console.log(`[BLOG/RESTORE] Blog is already active: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Blog is already active' },
        { status: 400 }
      );
    }

    // Restore blog by setting is_active to true
    console.log(`[BLOG/RESTORE] Restoring blog: ${id}`);
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          is_active: true,
          restored_at: new Date(),
          restored_by: auth.id
        },
        $unset: {
          deleted_at: "",
          deleted_by: ""
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      console.error(`[BLOG/RESTORE] Blog not found during update: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    if (updateResult.modifiedCount === 0) {
      console.error(`[BLOG/RESTORE] Blog restore failed: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Failed to restore blog' },
        { status: 500 }
      );
    }

    console.log(`[BLOG/RESTORE] Successfully restored blog: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Blog restored successfully',
      blog_id: id,
      restored_at: new Date().toISOString(),
      restored_by: auth.id
    });

  } catch (error) {
    console.error('[BLOG/RESTORE] Error restoring blog:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restore blog' 
      },
      { status: 500 }
    );
  }
}

// Alternative PUT method
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}
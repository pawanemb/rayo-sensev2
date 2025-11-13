import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[BLOGS/ID] API request received for blog ID: ${params.id} at ${new Date().toISOString()}`);

  try {
    // Validate the blog ID
    let blogId;
    try {
      blogId = new ObjectId(params.id);
    } catch (error) {
      console.error(`[BLOGS/ID] Invalid blog ID format: ${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Invalid blog ID format' },
        { status: 400 }
      );
    }

    console.log(`[BLOGS/ID] Connecting to MongoDB...`);
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('blogs');
    console.log(`[BLOGS/ID] Connected to MongoDB database: ${process.env.MONGODB_DB_NAME}, collection: blogs`);
    
    // Get the specific blog post by ID
    console.log(`[BLOGS/ID] Fetching blog post with ID: ${params.id}`);
    const blogPost = await collection.findOne({ _id: blogId });
    
    if (!blogPost) {
      console.log(`[BLOGS/ID] Blog post with ID ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }
    
    console.log(`[BLOGS/ID] Retrieved blog post: ${blogPost.title}`);
    
    return NextResponse.json({
      success: true,
      data: blogPost,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[BLOGS/ID] Error fetching blog post:', error);
    
    // Log stack trace for better debugging
    if (error instanceof Error) {
      console.error('[BLOGS/ID] Error stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred while fetching the blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[BLOGS/ID] PUT request received for blog ID: ${params.id} at ${new Date().toISOString()}`);

  try {
    // Validate the blog ID
    let blogId;
    try {
      blogId = new ObjectId(params.id);
    } catch (error) {
      console.error(`[BLOGS/ID] Invalid blog ID format: ${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Invalid blog ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content, word_count } = body;

    if (!content && !title) {
      return NextResponse.json(
        { success: false, error: 'Title or content is required' },
        { status: 400 }
      );
    }

    console.log(`[BLOGS/ID] Connecting to MongoDB for update...`);
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('blogs');
    
    // Build update object
    const updateFields: any = {
      updated_at: new Date().toISOString()
    };
    
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;
    if (word_count !== undefined) updateFields.word_count = word_count;
    
    // Update the blog post
    console.log(`[BLOGS/ID] Updating blog post with ID: ${params.id}`);
    const updateResult = await collection.updateOne(
      { _id: blogId },
      { $set: updateFields }
    );
    
    if (updateResult.matchedCount === 0) {
      console.log(`[BLOGS/ID] Blog post with ID ${params.id} not found for update`);
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }
    
    console.log(`[BLOGS/ID] Successfully updated blog post: ${params.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Blog post updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('[BLOGS/ID] Error updating blog post:', error);
    
    // Log stack trace for better debugging
    if (error instanceof Error) {
      console.error('[BLOGS/ID] Error stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred while updating the blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

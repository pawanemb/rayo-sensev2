import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Helper function to verify authentication
const verifyAuth = async (request: NextRequest) => {
  // Get token from cookies
  const token = request.cookies.get('_auth')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    
    return { user: data.user, token, id: data.user.id };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  console.log(`[BLOGS/LIST] API request received at ${new Date().toISOString()}`);
  
  // Verify authentication
  const auth = await verifyAuth(request);
  
  // Return 401 if not authenticated
  if (!auth) {
    console.log(`[BLOGS/LIST] Authentication failed`);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  console.log(`[BLOGS/LIST] Authenticated user: ${auth.id}`);

  try {
    // Parse query parameters for pagination, search, and sorting
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50); // Max 50 items per page
    const search = searchParams.get('search')?.trim() || '';
    const sortField = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') === 'asc' ? 1 : -1;

    console.log(`[BLOGS/LIST] Query params - page: ${page}, limit: ${limit}, search: "${search}", sort: ${sortField}, order: ${sortOrder}`);

    console.log(`[BLOGS/LIST] Connecting to MongoDB...`);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('blogs');
    console.log(`[BLOGS/LIST] Connected to MongoDB database: ${process.env.MONGODB_DB_NAME}`);
    
    // Build search filter
    let searchFilter: Record<string, unknown> = {};

    // Show all blogs (both active and inactive) by default
    
    // Add search criteria if provided
    if (search) {
      const searchCriteria = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
          { word_count: isNaN(parseInt(search)) ? null : parseInt(search) }
        ].filter(Boolean)
      };
      
      // Use search criteria without is_active filter
      searchFilter = searchCriteria;
    }

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    if (['title', 'created_at', 'updated_at', 'word_count', 'status', 'is_active'].includes(sortField)) {
      sortObj[sortField] = sortOrder;
    } else {
      sortObj['created_at'] = -1; // Default sort
    }

    console.log(`[BLOGS/LIST] Search filter:`, JSON.stringify(searchFilter));
    console.log(`[BLOGS/LIST] Sort object:`, JSON.stringify(sortObj));

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchFilter);
    console.log(`[BLOGS/LIST] Total matching blogs: ${totalCount}`);

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    console.log(`[BLOGS/LIST] Pagination - skip: ${skip}, limit: ${limit}, totalPages: ${totalPages}`);

    // Get blog posts with pagination, search, and sorting
    const blogPosts = await collection
      .find(searchFilter, { 
        projection: { 
          _id: 1,           // MongoDB document ID
          title: 1,         // Blog title
          project_id: 1,    // Reference to Supabase project
          word_count: 1,    // Blog word count
          created_at: 1,    // Creation timestamp
          updated_at: 1,    // Last update timestamp
          user_id: 1,       // Reference to Supabase user
          status: 1,        // Blog status (creating, completed, failed, etc.)
          is_active: 1      // Soft delete flag (true = active, false = deleted)
        } 
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    console.log(`[BLOGS/LIST] Retrieved ${blogPosts.length} blog posts from MongoDB`);
    console.log(`[BLOGS/LIST] Sample blog post:`, blogPosts.length > 0 ? JSON.stringify({
      _id: blogPosts[0]._id,
      title: blogPosts[0].title,
      project_id: blogPosts[0].project_id,
      user_id: blogPosts[0].user_id
    }) : 'No blog posts found');

    // Get unique project IDs from the results
    const projectIds = [...new Set(blogPosts.map(item => item.project_id))];
    console.log(`[BLOGS/LIST] Found ${projectIds.length} unique project IDs: ${projectIds.join(', ')}`);
    
    // Get unique user IDs from the results
    const userIds = [...new Set(blogPosts.map(item => item.user_id).filter(Boolean))];
    console.log(`[BLOGS/LIST] Found ${userIds.length} unique user IDs from blogs: ${userIds.join(', ')}`);
    
    // Fetch project details from Supabase
    console.log(`[BLOGS/LIST] Fetching project details from Supabase...`);
    const projectDetails: Record<string, unknown> = {};
    try {
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('id, name, url, user_id')
        .in('id', projectIds);
      
      if (error) {
        console.error('[BLOGS/LIST] Error fetching projects from Supabase:', error);
      } else if (projects) {
        console.log(`[BLOGS/LIST] Retrieved ${projects.length} projects from Supabase`);
        console.log(`[BLOGS/LIST] Sample project:`, projects.length > 0 ? JSON.stringify(projects[0]) : 'No projects found');
        
        // Get unique user IDs from projects
        const projectUserIds = [...new Set(projects.map(project => project.user_id).filter(Boolean))];
        console.log(`[BLOGS/LIST] Found ${projectUserIds.length} unique user IDs from projects: ${projectUserIds.join(', ')}`);
        
        // Add project user IDs to the userIds array if not already included
        projectUserIds.forEach(userId => {
          if (!userIds.includes(userId)) {
            userIds.push(userId);
            console.log(`[BLOGS/LIST] Added project user ID to userIds: ${userId}`);
          }
        });
        
        // Create a map of project details by ID
        projects.forEach(project => {
          projectDetails[project.id] = project;
          console.log(`[BLOGS/LIST] Added project details for project ID: ${project.id}, user_id: ${project.user_id}`);
        });
      }
    } catch (error) {
      console.error('[BLOGS/LIST] Error fetching project details:', error);
    }
    
    console.log(`[BLOGS/LIST] Final userIds for fetching user details: ${userIds.length} IDs: ${userIds.join(', ')}`);

    // Fetch user details efficiently - only for users we need
    const userDetails: Record<string, unknown> = {};
    if (userIds.length > 0) {
      try {
        console.log(`[BLOGS/LIST] Fetching user details for ${userIds.length} specific users`);
        console.log(`[BLOGS/LIST] User IDs needed: ${userIds.join(', ')}`);

        // Fetch users in parallel using getUserById - more reliable and faster
        console.log(`[BLOGS/LIST] Fetching ${userIds.length} users in parallel`);

        const usersPromises = userIds.map(async (userId) => {
          try {
            const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (error || !userData) {
              console.error(`[BLOGS/LIST] Error fetching user ${userId}:`, error);
              return { userId, user: null };
            }
            console.log(`[BLOGS/LIST] Successfully fetched user ${userId}`);
            return { userId, user: userData.user };
          } catch (error) {
            console.error(`[BLOGS/LIST] Error fetching user ${userId}:`, error);
            return { userId, user: null };
          }
        });

        const userResults = await Promise.all(usersPromises);

        userResults.forEach(({ userId, user }) => {
          if (user) {
            userDetails[userId] = {
              id: user.id,
              email: user.email || 'Unknown',
              name: user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown',
              avatar: user.user_metadata?.avatar_url || null
            };
          } else {
            // Fallback for failed user fetches
            userDetails[userId] = {
              id: userId,
              email: 'Unknown',
              name: 'Unknown User',
              avatar: null
            };
          }
        });
        
        console.log(`[BLOGS/LIST] Successfully processed user details for ${Object.keys(userDetails).length} users`)
      } catch (error) {
        console.error('[BLOGS/LIST] Error fetching user details:', error);
        
        // Even if there's an exception, we should still try to use any user IDs we have
        console.log(`[BLOGS/LIST] Using fallback user details for all ${userIds.length} user IDs due to exception`);
        userIds.forEach(userId => {
          userDetails[userId] = {
            id: userId,
            email: 'Unknown (Exception)',
            name: 'Unknown User',
            avatar: null
          };
        });
      }
    } else {
      console.log('[BLOGS/LIST] No user IDs to fetch, skipping user details request');
    }
    
    // Log the final user details map size
    console.log(`[BLOGS/LIST] Final userDetails map contains ${Object.keys(userDetails).length} users`);
    if (Object.keys(userDetails).length > 0) {
      const sampleUserId = Object.keys(userDetails)[0];
      console.log(`[BLOGS/LIST] Sample user details:`, JSON.stringify(userDetails[sampleUserId]));
    }
    
    // Enhance blog posts with project and user details
    console.log(`[BLOGS/LIST] Enhancing ${blogPosts.length} blog posts with project and user details`);

    const enhancedBlogs = blogPosts.map((blog) => {
      // Get project details
      const projectDetail = (projectDetails[blog.project_id] as { id: string; name: string; url: string; user_id: string }) || {
        id: blog.project_id,
        name: 'Unknown Project',
        url: '',
        user_id: ''
      };
      
      // First try to get user from blog's user_id
      let userDetail = null;
      if (blog.user_id && userDetails[blog.user_id]) {
        userDetail = userDetails[blog.user_id];
        console.log(`[BLOGS/LIST] Using blog user_id ${blog.user_id} for blog ${blog._id}`);
      } 
      // If not found, try to get user from project's user_id
      else if (projectDetail.user_id && userDetails[projectDetail.user_id]) {
        userDetail = userDetails[projectDetail.user_id];
        console.log(`[BLOGS/LIST] Using project user_id ${projectDetail.user_id} for blog ${blog._id}`);
      } 
      // If still not found, use default user details
      else {
        const fallbackUserId = blog.user_id || projectDetail.user_id || '';
        userDetail = {
          id: fallbackUserId,
          email: 'Unknown',
          name: 'Unknown User',
          avatar: null
        };
        console.log(`[BLOGS/LIST] Using fallback user details for blog ${blog._id} with user_id ${fallbackUserId}`);
      }
      
      // Create enhanced blog with project and user details
      const enhancedBlog = {
        ...blog,
        project_details: projectDetail,
        user_details: userDetail
      };
      
      return enhancedBlog;
    });
    
    // Count blogs with user details
    const blogsWithUserDetails = enhancedBlogs.filter(blog =>
      blog.user_details && (blog.user_details as { id?: string; name?: string }).id && (blog.user_details as { id?: string; name?: string }).name !== 'Unknown User'
    ).length;
    
    console.log(`[BLOGS/LIST] Enhanced ${enhancedBlogs.length} blogs, ${blogsWithUserDetails} have complete user details`);
    
    // Log a sample of the enhanced blogs
    if (enhancedBlogs.length > 0) {
      const sample = enhancedBlogs[0] as { _id: unknown; title?: string; project_details: unknown; user_details: unknown };
      console.log(`[BLOGS/LIST] Sample enhanced blog:`, JSON.stringify({
        _id: sample._id,
        title: sample.title,
        project_details: sample.project_details,
        user_details: sample.user_details
      }));
    }
    
    console.log(`[BLOGS/LIST] Returning response with ${enhancedBlogs.length} enhanced blogs`);
    
    // Prepare response object
    const responseData = {
      success: true,
      data: enhancedBlogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev,
        showing: enhancedBlogs.length
      },
      meta: {
        search: search || null,
        sort: sortField,
        order: sortOrder === 1 ? 'asc' : 'desc',
        blogs_with_user_details: blogsWithUserDetails,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[BLOGS/LIST] Error fetching blog list:', error);
    
    // Log stack trace for better debugging
    if (error instanceof Error) {
      console.error('[BLOGS/LIST] Error stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred while fetching blog list',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
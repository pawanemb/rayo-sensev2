import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import clientPromise from "@/lib/mongodb";
import { normalizeUser } from "@/lib/users/transform";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const resolvedParams = await params;
  const { id: projectId } = resolvedParams;

  try {
    console.log(`[PROJECT/${projectId}] API request received`);

    // Require admin authentication
    console.log(`[PROJECT/${projectId}] Auth passed for user: ${auth?.id}`);

    // Step 1: Fetch project details from Supabase
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        url,
        brand_name,
        gender,
        is_active,
        created_at,
        updated_at,
        user_id,
        cms_config,
        pinned,
        services,
        languages,
        age_groups,
        locations,
        brand_tone_settings,
        featured_image_style,
        feature_image_active,
        person_tone
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error(`[PROJECT/${projectId}] Error fetching project:`, projectError);
      return NextResponse.json({ error: 'Project not found', details: projectError?.message }, { status: 404 });
    }

    console.log(`[PROJECT/${projectId}] Project fetched successfully: ${project.name}`);

    // Step 2: Fetch user data from Supabase Auth
    let normalizedUser = null;
    if (project.user_id) {
      const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(project.user_id);
      
      if (userError) {
        console.warn(`[PROJECT/${projectId}] Could not fetch user ${project.user_id}:`, userError.message);
      } else if (authUser) {
        normalizedUser = normalizeUser(authUser.user);
      }
    }
    
    // Attach the user to the project object
    const projectWithUser = {
      ...project,
      user: normalizedUser
    };

    // Fetch blogs count and scraped content from MongoDB
    const page = Number(request.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 5;
    const skip = (page - 1) * limit;

    let blogsCount = 0;
    let recentBlogs: unknown[] = [];
    let scrapedContent: string | null = null;
    try {
      const mongoClient = await clientPromise;
      const db = mongoClient.db(process.env.MONGODB_DB_NAME);

      const blogsCollection = db.collection('blogs');
      const scrapedCollection = db.collection('scraped_content');

      // Run all MongoDB queries in parallel for better performance
      const [count, blogs, scrapedDoc] = await Promise.all([
        blogsCollection.countDocuments({
          project_id: projectId,
          is_active: { $ne: false }
        }),
        blogsCollection
          .find({
            project_id: projectId,
            is_active: { $ne: false }
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .project({ _id: 1, title: 1, status: 1, word_count: 1, created_at: 1 })
          .toArray(),
        scrapedCollection.findOne(
          { project_id: projectId },
          { projection: { html_content: 1 } }
        )
      ]);

      blogsCount = count;
      recentBlogs = blogs;
      if (scrapedDoc) {
        scrapedContent = scrapedDoc.html_content;
      }

    } catch (mongoError) {
      console.error(`[PROJECT/${projectId}] Error fetching MongoDB data:`, mongoError);
      // Return empty data on error but don't fail the entire request
    }

    console.log(`[PROJECT/${projectId}] Returning response with ${blogsCount} blogs`);

    return NextResponse.json({
      project: projectWithUser,
      blogsCount,
      recentBlogs,
      scrapedContent,
      projectInformation: {
        id: project.id,
        name: project.name,
        url: project.url,
        brand_name: project.brand_name,
        visitors: 0,
        is_active: project.is_active,
        created_at: project.created_at,
        updated_at: project.updated_at
      }
    });
  } catch (error) {
    console.error(`[PROJECT/${projectId}] Error in project API:`, error);
    if (error instanceof Error) {
      console.error(`[PROJECT/${projectId}] Error message:`, error.message);
      console.error(`[PROJECT/${projectId}] Error stack:`, error.stack);
    }
    return handleApiError(error);
  }
}

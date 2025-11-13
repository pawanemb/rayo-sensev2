export interface BlogPost {
  _id: string;
  title: string;
  project_id: string;
  word_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: string;
  is_active: boolean;
  project_details?: {
    id: string;
    name: string;
    url: string;
    user_id: string;
  };
  user_details?: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
  };
}

export interface BlogPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  showing: number;
}

export interface BlogListResponse {
  success: boolean;
  data: BlogPost[];
  pagination: BlogPaginationInfo;
  meta?: {
    search: string | null;
    sort: string;
    order: string;
    blogs_with_user_details: number;
    timestamp: string;
  };
}

export interface GetBlogsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  show_deleted?: boolean;
}

/**
 * Fetch paginated list of blogs with project and user details
 */
export const getBlogs = async (params: GetBlogsParams = {}): Promise<BlogListResponse> => {
  const { page = 1, limit = 10, search = "", sort = "created_at", order = "desc", show_deleted = false } = params;

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) query.set("search", search);
  if (sort) query.set("sort", sort);
  if (order) query.set("order", order);
  if (show_deleted) query.set("show_deleted", "true");

  const response = await fetch(`/api/blogs/list?${query.toString()}`, {
    cache: "no-store",
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch blogs");
  }

  const payload = await response.json();
  return payload;
};

/**
 * Fetch a single blog by ID
 */
export const getBlogById = async (id: string): Promise<BlogPost> => {
  const baseUrl = typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    : '';

  const response = await fetch(`${baseUrl}/api/blogs/${id}`, {
    cache: "no-store",
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch blog");
  }

  const payload = await response.json();
  return payload.data as BlogPost;
};

/**
 * Delete a blog by ID
 */
export const deleteBlog = async (id: string): Promise<void> => {
  const response = await fetch(`/api/blogs/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to delete blog");
  }
};

/**
 * Update a blog by ID
 */
export const updateBlog = async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
  const response = await fetch(`/api/blogs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to update blog");
  }

  return payload.data as BlogPost;
};

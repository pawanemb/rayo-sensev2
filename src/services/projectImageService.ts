export interface ProjectImage {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  bucket_name: string;
  public_url: string;
  image_metadata: Record<string, unknown> | null;
  width: number | null;
  height: number | null;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  // Populated fields from joins
  project?: {
    name: string;
    url: string;
  };
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetImagesResponse {
  images: ProjectImage[];
  pagination: PaginationInfo;
}

export interface GetImagesParams {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
  userId?: string;
  category?: string;
}

export async function getProjectImages(
  params: GetImagesParams = {}
): Promise<GetImagesResponse> {
  const { page = 1, limit = 10, search = "", projectId, userId, category } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(projectId && { projectId }),
    ...(userId && { userId }),
    ...(category && { category }),
  });

  const response = await fetch(`/api/images?${queryParams}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch images");
  }

  return response.json();
}

export async function getProjectImageById(id: string): Promise<ProjectImage> {
  const response = await fetch(`/api/images/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }

  return response.json();
}

export async function deleteProjectImage(id: string): Promise<void> {
  const response = await fetch(`/api/images/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete image");
  }
}

export async function updateProjectImage(
  id: string,
  data: Partial<ProjectImage>
): Promise<ProjectImage> {
  const response = await fetch(`/api/images/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update image");
  }

  return response.json();
}

import type { NormalizedUser } from "@/lib/users/types";

export type User = NormalizedUser;

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number | null;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserListResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

type ApiPagination = {
  total?: number | null;
  page?: number;
  perPage?: number;
  totalPages?: number | null;
};

const parsePagination = (
  payload: ApiPagination | undefined,
  fallbackPage: number,
  fallbackLimit: number
): PaginationInfo => {
  const total = typeof payload?.total === "number" ? payload.total : null;
  const page = payload?.page ?? fallbackPage;
  const perPage = payload?.perPage ?? fallbackLimit;
  const derivedTotalPages =
    typeof total === "number" ? Math.max(1, Math.ceil(total / perPage)) : payload?.totalPages ?? null;

  return {
    currentPage: page,
    totalPages: derivedTotalPages ?? 1,
    totalUsers: total,
    limit: perPage,
    hasNextPage: derivedTotalPages ? page < derivedTotalPages : false,
    hasPrevPage: page > 1,
  };
};

export const getUsers = async (params: GetUsersParams = {}): Promise<UserListResponse> => {
  const { page = 1, limit = 10, search = "" } = params;
  const query = new URLSearchParams({
    page: page.toString(),
    perPage: limit.toString(),
  });
  if (search) query.set("search", search);

  const response = await fetch(`/api/users?${query.toString()}`, {
    cache: "no-store",
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch users");
  }

  const payload = await response.json();

  return {
    users: payload.users as User[],
    pagination: parsePagination(payload.pagination, page, limit),
  };
};

export const getUserById = async (id: string): Promise<User> => {
  // Check if we're on the server or client
  const baseUrl = typeof window === 'undefined' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    : '';
  
  const response = await fetch(`${baseUrl}/api/users/${id}`, {
    cache: "no-store",
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch user");
  }

  const payload = await response.json();
  return payload.user as User;
};

type CreateUserPayload = {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
};

export const createUser = async (data: CreateUserPayload): Promise<User> => {
  const response = await fetch(`/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to create user");
  }

  return payload.user as User;
};

type UpdateUserPayload = {
  email?: string;
  password?: string;
  metadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
};

export const updateUser = async (id: string, data: UpdateUserPayload): Promise<User> => {
  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to update user");
  }

  return payload.user as User;
};

export const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to delete user");
  }
};

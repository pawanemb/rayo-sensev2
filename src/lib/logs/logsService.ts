// Logs service for interacting with the backend API
// This service calls our secure backend endpoints

export interface DashboardSummaryData {
  total_scrapes: number;
  successful_scrapes: number;
  failed_scrapes: number;
  success_rate: number;
  avg_duration_sec: number;
  cache_hit_rate: number;
  last_updated: string;
}

export interface UserDetails {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

export interface ProjectDetails {
  id: string;
  name: string;
  url: string;
  user_id: string;
}

export interface BlogDetails {
  id: string;
  title: string;
  status: string;
  word_count: number | string | number[];
}

export interface ScrapeRequest {
  id: number;
  timestamp: string;
  url: string;
  method: string;
  status: string;
  duration_ms: number;
  response_content: string;
  proxy_used: boolean;
  proxy_provider: string;
  proxy_success: boolean;
  cache_hit: boolean;
  error_type: string;
  error_message: string;
  stack_trace: string;
  project_id: string | null;
  user_id: string | null;
  blog_id?: string | null;
  comments?: string | null;
  user_details?: UserDetails | null;
  project_details?: ProjectDetails | null;
  blog_details?: BlogDetails | null;
}

export interface ErrorLog {
  id: number;
  timestamp: string;
  error_type: string;
  error_message: string;
  url: string;
  method: string;
  frequency: number;
  stack_trace: string;
  project_id: string | null;
  user_id: string | null;
  blog_id?: string | null;
  comments?: string | null;
  user_details?: UserDetails | null;
  project_details?: ProjectDetails | null;
  blog_details?: BlogDetails | null;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ScrapeRequestsResponse {
  data: ScrapeRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorLogsResponse {
  data: ErrorLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardSummaryResponse {
  data: DashboardSummaryData | null;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  table: 'scrape_requests' | 'error_logs' | 'dashboard_summary';
}

// Get dashboard summary - secure backend API call
export const getDashboardSummary = async (): Promise<DashboardSummaryData | null> => {
  try {
    const response = await fetch('/api/logs?table=dashboard_summary', {
      credentials: 'include' // Include cookies in the request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch dashboard summary (Status: ${response.status})`);
    }

    const result: DashboardSummaryResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return null;
  }
};

// Get scrape requests with pagination - secure backend API call
export const getScrapeRequests = async (params: { page?: number; limit?: number } = {}): Promise<ScrapeRequestsResponse> => {
  try {
    const { page = 1, limit = 50 } = params;

    const searchParams = new URLSearchParams({
      table: 'scrape_requests',
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`/api/logs?${searchParams}`, {
      credentials: 'include' // Include cookies in the request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch scrape requests (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scrape requests:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0
    };
  }
};

// Get error logs with pagination - secure backend API call
export const getErrorLogs = async (params: { page?: number; limit?: number } = {}): Promise<ErrorLogsResponse> => {
  try {
    const { page = 1, limit = 50 } = params;

    const searchParams = new URLSearchParams({
      table: 'error_logs',
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`/api/logs?${searchParams}`, {
      credentials: 'include' // Include cookies in the request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch error logs (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0
    };
  }
};

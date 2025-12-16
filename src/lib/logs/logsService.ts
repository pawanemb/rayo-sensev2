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

// ============= CRAWL TASKS TYPES & FUNCTIONS =============

export interface CrawlTask {
  id: string;
  seed_url: string;
  domain: string;
  status: string;
  max_pages: number;
  use_proxy: boolean;
  respect_robots: boolean;
  pages_crawled: number;
  pages_failed: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  project_id: string | null;
  user_id: string | null;
  comments: string | null;
  celery_task_id: string | null;
  error_message: string | null;
  urls_found: number;
  urls_queued: number;
  duration_seconds: number | null;
  user_details?: UserDetails | null;
  project_details?: ProjectDetails | null;
}

export interface CrawlPage {
  id: string;
  task_id: string;
  url: string;
  title: string | null;
  markdown_content: string | null;
  html_content: string | null;
  method: string | null;
  status: string | null;
  content_length: number | null;
  links_found: string[] | null;
  links_count: number;
  duration_ms: number | null;
  crawled_at: string;
  error_message: string | null;
  proxy_used: boolean;
}

export interface CrawlSummary {
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  total_pages_crawled: number;
  total_pages_failed: number;
  total_urls_found: number;
  total_urls_queued: number;
}

export interface CrawlTasksResponse {
  data: CrawlTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CrawlPagesResponse {
  data: CrawlPage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Get crawl summary - secure backend API call
export const getCrawlSummary = async (): Promise<CrawlSummary | null> => {
  try {
    const response = await fetch('/api/crawl?table=crawl_summary', {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch crawl summary (Status: ${response.status})`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching crawl summary:', error);
    return null;
  }
};

// Get crawl tasks with pagination - secure backend API call
export const getCrawlTasks = async (params: { page?: number; limit?: number } = {}): Promise<CrawlTasksResponse> => {
  try {
    const { page = 1, limit = 10 } = params;

    const searchParams = new URLSearchParams({
      table: 'crawl_tasks',
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`/api/crawl?${searchParams}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch crawl tasks (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching crawl tasks:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
  }
};

// Get crawl pages with pagination - secure backend API call
export const getCrawlPages = async (params: { page?: number; limit?: number; taskId?: string } = {}): Promise<CrawlPagesResponse> => {
  try {
    const { page = 1, limit = 10, taskId } = params;

    const searchParams = new URLSearchParams({
      table: 'crawl_pages',
      page: page.toString(),
      limit: limit.toString()
    });

    if (taskId) {
      searchParams.set('task_id', taskId);
    }

    const response = await fetch(`/api/crawl?${searchParams}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch crawl pages (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching crawl pages:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
  }
};

// Start a new crawl task
export interface StartCrawlParams {
  seed_url: string;
  max_pages?: number;
  use_proxy?: boolean;
  respect_robots?: boolean;
}

export const startCrawlTask = async (params: StartCrawlParams): Promise<{ success: boolean; message?: string; error?: string; data?: unknown }> => {
  try {
    const response = await fetch('/api/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'start',
        seed_url: params.seed_url,
        max_pages: params.max_pages || 100,
        use_proxy: params.use_proxy ?? true,
        respect_robots: params.respect_robots ?? true,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to start crawl task',
      };
    }

    return result;
  } catch (error) {
    console.error('Error starting crawl task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Cancel a crawl task
export const cancelCrawlTask = async (taskId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch('/api/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'cancel',
        task_id: taskId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to cancel crawl task',
      };
    }

    return result;
  } catch (error) {
    console.error('Error canceling crawl task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get task status from backend
export const getTaskStatus = async (taskId: string): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const response = await fetch(`/api/crawl?table=task_status&task_id=${taskId}`, {
      credentials: 'include'
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch task status' };
    }

    return result;
  } catch (error) {
    console.error('Error fetching task status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get pages from backend API
export const getBackendPages = async (taskId: string, limit = 100, offset = 0): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const response = await fetch(`/api/crawl?table=backend_pages&task_id=${taskId}&limit=${limit}&page=${Math.floor(offset / limit) + 1}`, {
      credentials: 'include'
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch pages' };
    }

    return result;
  } catch (error) {
    console.error('Error fetching backend pages:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get tasks list from backend API
export const getBackendTasks = async (limit = 50): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const response = await fetch(`/api/crawl?table=backend_tasks&limit=${limit}`, {
      credentials: 'include'
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch tasks' };
    }

    return result;
  } catch (error) {
    console.error('Error fetching backend tasks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============= CACHE MANAGEMENT FUNCTIONS =============

export interface CacheStats {
  enabled: boolean;
  keys: number;
  memory_used: string;
  hits: number;
  misses: number;
  hit_rate: number;
}

// Get cache statistics
export const getCacheStats = async (): Promise<{ success: boolean; data?: CacheStats; error?: string }> => {
  try {
    const response = await fetch('/api/crawl?table=cache_stats', {
      credentials: 'include'
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch cache stats' };
    }

    return result;
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete cache for specific URL
export const deleteCacheForUrl = async (url: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`/api/crawl?action=cache_url&url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete cache' };
    }

    return result;
  } catch (error) {
    console.error('Error deleting cache for URL:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Clear all cache
export const clearAllCache = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch('/api/crawl?action=cache_clear', {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to clear cache' };
    }

    return result;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

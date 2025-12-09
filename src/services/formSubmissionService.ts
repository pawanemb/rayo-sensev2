// Form submission service for interacting with the backend API
// This service calls our secure backend endpoints for form submissions

// Types based on the free_analysis_submissions table schema
export interface IPDetails {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  flag: string;
  isLocal: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  org?: string;
  postal?: string;
}

export interface FormSubmission {
  id: string;
  email: string;
  website: string;
  ip_address?: string;
  user_agent?: string;
  status: 'email sent' | 'error' | 'processing' | 'done';
  created_at: string;
  updated_at: string;
  processed_at?: string;
  notes?: string;
  ipDetails?: IPDetails | null;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalSubmissions: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FormSubmissionListResponse {
  submissions: FormSubmission[];
  pagination: PaginationInfo;
}

export interface GetFormSubmissionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

// Get form submissions with pagination - secure backend API call
export const getFormSubmissions = async (params: GetFormSubmissionsParams = {}): Promise<FormSubmissionListResponse> => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = params;
    
    // Build query parameters
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status })
    });
    
    // Call our secure backend API - cookies will be automatically included
    const response = await fetch(`/api/form-submissions?${searchParams}`, {
      credentials: 'include' // Include cookies in the request
    });
    
    if (!response.ok) {
      // Try to get more detailed error information
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error(errorData.error || 'Unauthorized. Admin access required. Please check if you have admin privileges.');
      } else {
        throw new Error(errorData.error || `Failed to fetch form submissions (Status: ${response.status})`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    
    // Fallback to mock data if API fails
    return {
      submissions: [
        {
          id: '1',
          email: 'user@example.com',
          website: 'https://example.com',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'email sent',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: undefined
        },
        {
          id: '2',
          email: 'contact@company.com',
          website: 'https://company.com',
          ip_address: '203.0.113.195',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          status: 'done',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          processed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          notes: 'Analysis completed successfully'
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalSubmissions: 2,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
};

// Get a specific form submission by ID
export const getFormSubmissionById = async (id: string): Promise<FormSubmission> => {
  try {
    const response = await fetch(`/api/form-submissions/${id}`, {
      credentials: 'include' // Include cookies in the request
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch form submission');
    }
    
    const data = await response.json();
    return data.submission;
  } catch (error) {
    console.error('Error fetching form submission:', error);
    throw error;
  }
};

// Update form submission status or notes
export const updateFormSubmission = async (id: string, updates: Partial<FormSubmission>): Promise<FormSubmission> => {
  try {
    const response = await fetch(`/api/form-submissions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies in the request
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update form submission');
    }
    
    const data = await response.json();
    return data.submission;
  } catch (error) {
    console.error('Error updating form submission:', error);
    throw error;
  }
};


// Get form submission statistics
export const getFormSubmissionStats = async (): Promise<{
  total: number;
  emailSent: number;
  processing: number;
  done: number;
  error: number;
}> => {
  try {
    const response = await fetch('/api/form-submissions/stats', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch form submission stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching form submission stats:', error);
    // Return mock stats
    return {
      total: 0,
      emailSent: 0,
      processing: 0,
      done: 0,
      error: 0
    };
  }
};
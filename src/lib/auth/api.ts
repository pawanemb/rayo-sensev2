import { tokenManager } from './tokenManager';

export interface User {
  id: string;
  email: string;
  full_name: string;
  email_confirmed: boolean;
  avatar?: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Helper to extract error messages
const getErrorMessage = (error: unknown): string => {
  const isAxiosError = (err: unknown): err is {
    response?: {
      status?: number;
      data?: {
        detail?: string;
        message?: string;
      };
    };
    message?: string;
  } => {
    return typeof err === 'object' && err !== null && 'response' in err;
  };

  if (isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please check your credentials.';
      case 403:
        return 'Access forbidden. Admin role required.';
      case 404:
        return 'Account not found';
      case 500:
        return 'Server error. Please try again later';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Process API responses and update tokens
function processApiResponse<T>(response: T): T {
  if (response && typeof response === 'object' && ('access_token' in response || 'refresh_token' in response)) {
    console.log('🔄 [AUTH API] Response contains tokens, updating storage');
    tokenManager.updateTokensFromResponse(response);
  }
  return response;
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email.toLowerCase(),
          password: credentials.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Use detail for user-friendly message, fallback to error or raw_error
        const message = errorData.detail || errorData.error || errorData.raw_error || 'Login failed';
        console.error('❌ [Auth API] Login error:', message);
        throw new Error(message);
      }

      const data = await response.json();
      return processApiResponse(data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async refreshToken(): Promise<LoginResponse> {
    try {
      console.log('🔄 [AUTH] Starting token refresh...');

      const refresh_token = tokenManager.getRefreshToken();
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Use detail for user-friendly message, fallback to error or raw_error
        const message = errorData.detail || errorData.error || errorData.raw_error || 'Token refresh failed';
        console.error('❌ [Auth API] Refresh error:', message);
        throw new Error(message);
      }

      const data = await response.json();
      console.log('✅ [AUTH] Token refresh successful');
      return processApiResponse(data);
    } catch (error) {
      console.error('❌ [AUTH] Token refresh failed:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async logout(): Promise<void> {
    tokenManager.clearTokens();
  },
};

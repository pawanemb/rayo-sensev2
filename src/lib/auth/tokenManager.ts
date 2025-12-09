/**
 * Token Manager - Cookie-based token storage
 * Manages JWT tokens in cookies for authentication
 */

interface JWTPayload {
  exp: number;
  sub: string;
  email: string;
  role?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    role?: string;
  };
  app_metadata?: {
    role?: string;
    provider?: string;
    providers?: string[];
  };
}

interface Tokens {
  access_token: string;
  refresh_token?: string;
  provider_token?: string;
  expires_at?: number;
  expires_in?: number;
}

// Cookie names
const AUTH_COOKIE_NAME = '_auth';
const AUTH_REFRESH_COOKIE_NAME = '_auth_refresh';
const AUTH_STATE_COOKIE_NAME = '_auth_state';
const AUTH_TYPE_COOKIE_NAME = '_auth_type';

/**
 * Helper function to get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      try {
        return decodeURIComponent(cookieValue);
      } catch {
        return cookieValue;
      }
    }
  }
  return null;
}

/**
 * Helper function to set cookie
 */
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/${secure}; SameSite=Lax`;
}

/**
 * Helper function to delete cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

class TokenManager {
  getAccessToken(): string | null {
    return getCookie(AUTH_COOKIE_NAME);
  }

  getRefreshToken(): string | null {
    return getCookie(AUTH_REFRESH_COOKIE_NAME);
  }

  getTokens(): Tokens | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    return {
      access_token: accessToken,
      refresh_token: this.getRefreshToken() || undefined,
    };
  }

  setTokens(tokens: Tokens): void {
    if (tokens.expires_in && !tokens.expires_at) {
      tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
    }

    if (tokens.access_token) {
      setCookie(AUTH_COOKIE_NAME, tokens.access_token, 7);
    }
    if (tokens.refresh_token) {
      setCookie(AUTH_REFRESH_COOKIE_NAME, tokens.refresh_token, 30);
    }

    setCookie(AUTH_TYPE_COOKIE_NAME, 'Bearer', 7);

    console.log('🔑 [TokenManager] Tokens set in cookies');
  }

  clearTokens(): void {
    deleteCookie(AUTH_COOKIE_NAME);
    deleteCookie(AUTH_REFRESH_COOKIE_NAME);
    deleteCookie(AUTH_STATE_COOKIE_NAME);
    deleteCookie(AUTH_TYPE_COOKIE_NAME);

    console.log('🧹 [TokenManager] All tokens cleared');
  }

  setUserState(user: unknown): void {
    if (user) {
      setCookie(AUTH_STATE_COOKIE_NAME, JSON.stringify(user), 7);
    }
  }

  getUserState(): unknown | null {
    const userStr = getCookie(AUTH_STATE_COOKIE_NAME);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  setLoggedOut(): void {
    localStorage.setItem('logged_out', 'true');
  }

  wasLoggedOut(): boolean {
    return localStorage.getItem('logged_out') === 'true';
  }

  clearLogoutFlag(): void {
    localStorage.removeItem('logged_out');
  }

  isTokenExpired(): boolean {
    try {
      const token = this.getAccessToken();
      if (!token) return true;

      const payload = this.getJWTPayload();
      if (payload?.exp) {
        const expiresAtMs = payload.exp * 1000;
        return Date.now() >= expiresAtMs;
      }

      return true;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  getJWTPayload(): JWTPayload | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;

      const jsonPayload = atob(paddedBase64);
      const decoded = JSON.parse(jsonPayload);

      // Debug: Log the JWT payload structure once
      if (typeof window !== 'undefined' && !(window as unknown as { __jwt_logged?: boolean }).__jwt_logged) {
        console.log('🔍 [JWT] Payload structure:', {
          has_role: !!decoded.role,
          has_user_metadata: !!decoded.user_metadata,
          has_app_metadata: !!decoded.app_metadata,
          user_metadata_role: decoded.user_metadata?.role,
          app_metadata_role: decoded.app_metadata?.role,
        });
        (window as unknown as { __jwt_logged?: boolean }).__jwt_logged = true;
      }

      return decoded;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  getUserId(): string | null {
    const payload = this.getJWTPayload();
    return payload?.sub || null;
  }

  getUserEmail(): string | null {
    const payload = this.getJWTPayload();
    return payload?.email || null;
  }

  getUserRole(): string | null {
    const payload = this.getJWTPayload();
    // Check app_metadata.role FIRST (this is where Supabase stores custom roles)
    // Skip payload.role if it's just 'authenticated' (Supabase's default)
    const role = payload?.app_metadata?.role ||
                 payload?.user_metadata?.role ||
                 (payload?.role !== 'authenticated' ? payload?.role : null);

    console.log('🔍 [TokenManager] Role detection:', {
      from_app_metadata: payload?.app_metadata?.role,
      from_user_metadata: payload?.user_metadata?.role,
      from_role: payload?.role,
      final_role: role
    });

    return role || null;
  }

  getUserName(): string | null {
    const payload = this.getJWTPayload();
    return payload?.user_metadata?.full_name || payload?.user_metadata?.name || null;
  }

  getUserAvatar(): string | null {
    const payload = this.getJWTPayload();
    return payload?.user_metadata?.avatar_url || payload?.user_metadata?.picture || null;
  }

  updateTokensFromResponse(response: unknown): boolean {
    if (response && typeof response === 'object' && 'access_token' in response) {
      const tokenResponse = response as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        expires_at?: number;
      };

      const newTokens: Tokens = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || this.getRefreshToken() || undefined,
        expires_in: tokenResponse.expires_in,
        expires_at: tokenResponse.expires_at,
      };

      this.setTokens(newTokens);
      return true;
    }
    return false;
  }
}

export const tokenManager = new TokenManager();

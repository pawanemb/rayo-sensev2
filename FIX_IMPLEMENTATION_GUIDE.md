# Implementation Guide - Authentication Fixes

## Fix #1: Add `credentials: 'include'` to userService.ts

**File**: `src/services/userService.ts`

Change all 5 fetch calls to include credentials:

```typescript
// Line 61 - getUsers()
export const getUsers = async (params: GetUsersParams = {}): Promise<UserListResponse> => {
  const { page = 1, limit = 10, search = "" } = params;
  const query = new URLSearchParams({
    page: page.toString(),
    perPage: limit.toString(),
  });
  if (search) query.set("search", search);

  // CHANGE THIS:
  const response = await fetch(`/api/users?${query.toString()}`, {
    cache: "no-store",
    credentials: 'include', // ADD THIS LINE
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

// Line 84 - getUserById()
export const getUserById = async (id: string): Promise<User> => {
  const baseUrl = typeof window === 'undefined' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    : '';
  
  // CHANGE THIS:
  const response = await fetch(`${baseUrl}/api/users/${id}`, {
    cache: "no-store",
    credentials: 'include', // ADD THIS LINE
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch user");
  }

  const payload = await response.json();
  return payload.user as User;
};

// Line 105 - createUser()
export const createUser = async (data: CreateUserPayload): Promise<User> => {
  // CHANGE THIS:
  const response = await fetch(`/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: 'include', // ADD THIS LINE
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to create user");
  }

  return payload.user as User;
};

// Line 130 - updateUser()
export const updateUser = async (id: string, data: UpdateUserPayload): Promise<User> => {
  // CHANGE THIS:
  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: 'include', // ADD THIS LINE
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to update user");
  }

  return payload.user as User;
};

// Line 148 - deleteUser()
export const deleteUser = async (id: string): Promise<void> => {
  // CHANGE THIS:
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    credentials: 'include', // ADD THIS LINE
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to delete user");
  }
};
```

---

## Fix #2: Add `credentials: 'include'` to projects/page.tsx

**File**: `src/app/(admin)/projects/page.tsx`

Change 2 fetch calls:

```typescript
// Line 136 - fetchProjects function
const fetchProjects = useCallback(
  async (page = 1, search = "", limit = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // CHANGE THIS:
      const response = await fetch(
        `/api/projects?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          credentials: 'include', // ADD THIS LINE
        }
      );
      
      if (!response.ok) throw new Error("Failed to load projects");
      const data = await response.json();
      setProjects(data.projects || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  },
  []
);

// Line 101 - handleConfirmToggle function
const handleConfirmToggle = async () => {
  if (!selectedProject || togglingStatus) return;

  const { id: projectId, currentStatus } = selectedProject;
  const newStatus = !currentStatus;
  const action = newStatus ? 'activate' : 'deactivate';

  setTogglingStatus(projectId);
  closeConfirmModal();
  try {
    // CHANGE THIS:
    const response = await fetch(`/api/projects/${projectId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newStatus }),
      credentials: 'include', // ADD THIS LINE
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} project`);
    }

    // Refresh the projects list
    await fetchProjects(pagination.currentPage, searchTerm, pagination.limit);
  } catch (err) {
    console.error(`Failed to ${action} project:`, err);
    alert(err instanceof Error ? err.message : `Failed to ${action} project`);
  } finally {
    setTogglingStatus(null);
  }
};
```

---

## Fix #3: Remove Global Client Caching from server.ts

**File**: `src/lib/supabase/server.ts`

Replace entire file with this version (no global caching):

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// REMOVED: Global cache variable is no longer needed
// const globalForSupabase = global as typeof globalThis & {
//   _supabaseServerClient?: SupabaseClient;
// };

export async function createClient() {
  const cookieStore = await cookies()

  // REMOVED: No more caching - create fresh client every time
  // This ensures we always read current cookies, not stale ones

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie modification can only happen in Server Actions or Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Cookie modification can only happen in Server Actions or Route Handlers
          }
        },
      },
    }
  )

  return client;
}
```

**What changed:**
- Removed lines 5-8 (global cache variable)
- Removed lines 14-16 (cache check)
- Removed lines 44-45 (cache assignment)
- Added comment explaining why caching is removed

---

## Fix #4: Add Authentication to projects/[id]/route.ts

**File**: `src/app/api/projects/[id]/route.ts`

Add import and authentication check:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleApiError, requireAdmin } from "@/lib/auth/requireAdmin"; // ADD THIS IMPORT

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ADD THESE TWO LINES:
    await requireAdmin(); // Verify admin authentication
    
    const resolvedParams = await params;
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    // CHANGE THIS from generic error handler:
    return handleApiError(error); // To use centralized error handler
  }
}
```

---

## Fix #5: Consolidate auth/session/route.ts

**File**: `src/app/api/auth/session/route.ts`

Replace the entire file:

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    // Use centralized requireAdmin() instead of duplicating logic
    const user = await requireAdmin();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase(),
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**What changed:**
- Removed duplicate auth logic (getUser, role checking)
- Now uses centralized `requireAdmin()` which handles all that
- Uses consistent `handleApiError()` for responses
- Much simpler and more maintainable

---

## Fix #6: Improve AuthContext.tsx - Part 1 (Remove Stale Cookie Preloading)

**File**: `src/context/AuthContext.tsx` 

**Remove lines 85-126** and replace with this:

```typescript
// Remove the entire first useEffect that pre-loads cookies
// Delete this block:
/*
  useEffect(() => {
    if (mounted) {
      // Check for cookie-based auth first
      const hasAuthCookie = Cookies.get('auth') || Cookies.get('supabase-auth-token');

      if (hasAuthCookie) {
        setIsAuthenticated(true);
        try {
          const authData = Cookies.get('auth');
          if (authData) {
            const userData = JSON.parse(authData);
            setUser(userData);
          }
        } catch (e) {
          console.error('Error parsing auth cookie:', e);
        }
        setLoading(false);
      }

      if (!isSigninPage) {
        setTimeout(() => {
          checkSession();
        }, 100);
      } else {
        setLoading(false);
      }
    }
  }, [mounted, checkSession]);
*/

// Replace with this simpler version:
useEffect(() => {
  if (mounted) {
    const isSigninPage = typeof window !== 'undefined' && (
      window.location.pathname.includes('/signin') ||
      window.location.pathname.includes('/login')
    );

    if (isSigninPage) {
      // On signin page, don't check session - user hasn't logged in yet
      setLoading(false);
    } else {
      // On all other pages, always verify session with server
      // Don't trust local cookies - they might be stale
      checkSession();
    }
  }
}, [mounted, checkSession]);
```

---

## Fix #6B: Improve AuthContext.tsx - Part 2 (Faster Session Checks)

**File**: `src/context/AuthContext.tsx` 

**Change lines 128-146** from:

```typescript
useEffect(() => {
  if (!mounted) return;

  const isSigninPage = typeof window !== 'undefined' && (
    window.location.pathname.includes('/signin') ||
    window.location.pathname.includes('/login')
  );

  if (isSigninPage) return;

  const intervalId = setInterval(() => {
    if (isAuthenticated) {
      checkSession();
    }
  }, 5 * 60 * 1000); // 5 minutes - TOO LONG

  return () => clearInterval(intervalId);
}, [mounted, isAuthenticated, checkSession]);
```

To:

```typescript
useEffect(() => {
  if (!mounted) return;

  const isSigninPage = typeof window !== 'undefined' && (
    window.location.pathname.includes('/signin') ||
    window.location.pathname.includes('/login')
  );

  if (isSigninPage) return;

  // Check session more frequently (every 30 seconds)
  // This catches expired sessions faster
  const intervalId = setInterval(() => {
    checkSession();
  }, 30 * 1000); // 30 seconds instead of 5 minutes

  return () => clearInterval(intervalId);
}, [mounted, checkSession]);
```

---

## Implementation Checklist

- [ ] Fix #1: Add `credentials: 'include'` to `src/services/userService.ts` (5 places)
- [ ] Fix #2: Add `credentials: 'include'` to `src/app/(admin)/projects/page.tsx` (2 places)
- [ ] Fix #3: Replace `src/lib/supabase/server.ts` (remove caching)
- [ ] Fix #4: Add auth to `src/app/api/projects/[id]/route.ts`
- [ ] Fix #5: Replace `src/app/api/auth/session/route.ts`
- [ ] Fix #6A: Simplify `src/context/AuthContext.tsx` useEffect (remove stale cookie preloading)
- [ ] Fix #6B: Update session check interval in `src/context/AuthContext.tsx` (5min -> 30s)

---

## Testing After Each Fix

### After Fix #1-2 (Add credentials):
```bash
npm run dev
# Login and verify:
# - Dashboard loads without errors
# - User list loads without 401
# - Projects list loads without 401
# Check browser Network tab:
# - API requests show Request Headers with Cookie
```

### After Fix #3 (Remove caching):
```bash
# Kill and restart dev server
# Login and verify:
# - Still works after restart
# - Server-side session refresh works
```

### After Fix #4 (Protect endpoint):
```bash
# Open browser console, try without login:
curl 'http://localhost:3000/api/projects/123'
# Should return 401 or 403, not project data
```

### After Fix #5 (Consolidate auth):
```bash
# Check that /api/auth/session works the same way
# as other protected endpoints
```

### After Fix #6 (Improve AuthContext):
```bash
# Open DevTools, watch Network tab
# Login -> you should see /api/auth/session call
# Within 30 seconds, another /api/auth/session call should appear
# (Previously was 5 minutes)
```

---

## Rollback Plan

If something breaks:

1. **Git** - Revert to previous commit:
   ```bash
   git revert HEAD~1
   npm run dev
   ```

2. **Individual fixes** - Can be reverted one at a time

3. **Feature flag** - Could wrap fixes in environment variable:
   ```typescript
   if (process.env.NEXT_AUTH_IMPROVEMENTS === 'true') {
     // Use new code
   } else {
     // Use old code
   }
   ```

---

## Monitoring After Deployment

Add logging to track auth improvements:

```typescript
// In requireAdmin() - add logging
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.log('[AUTH] User not found or error:', error);
    throw new AdminAccessError("Authentication required", 401);
  }

  console.log('[AUTH] User verified:', user.email);
  // ...
}
```

Watch server logs for:
- Decrease in "Authentication required" errors
- No repeated 401 -> 200 patterns
- Consistent auth checks


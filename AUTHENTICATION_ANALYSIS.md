# COMPREHENSIVE AUTHENTICATION INCONSISTENCY ANALYSIS
## Rayo Sense v2 - Next.js Admin Dashboard

---

## EXECUTIVE SUMMARY

This Next.js application has **critical authentication inconsistencies** causing intermittent "authentication required" errors and unreliable session management. The root causes are:

1. **Multiple authentication mechanisms competing without coordination**
2. **Global client caching causing stale session state**
3. **No `credentials: 'include'` on most API calls (except special cases)**
4. **Race conditions between login, cookie setting, and API verification**
5. **Inconsistent authentication checks across API routes**
6. **Server-side session state not syncing with client cookies**

---

## PROBLEM 1: MULTIPLE AUTHENTICATION METHODS - UNCOORDINATED

### Three Authentication Layers Running in Parallel:

#### 1A. **Supabase SSR Session** (Server-side)
- Location: `src/lib/supabase/server.ts`
- Uses: Supabase cookie-based session management via `createServerClient()`
- **PROBLEM**: Global singleton instance cached in `globalForSupabase._supabaseServerClient`

```typescript
// src/lib/supabase/server.ts - Line 14-16
if (globalForSupabase._supabaseServerClient) {
  return globalForSupabase._supabaseServerClient;
}
```

**Why This Is Broken**: 
- The cached client is reused across all requests
- If session expires during app uptime, the cached instance still holds old credentials
- New requests inherit the stale cached session instead of reading fresh cookies
- Server can't properly refresh authentication mid-session

#### 1B. **Custom Cookie-Based Session** (Client-side)
- Location: `src/context/AuthContext.tsx`
- Uses: Two separate cookies:
  - `auth` cookie: Stores serialized user object
  - `supabase-auth-token` cookie: Stores explicit auth token (set in signin)

**PROBLEM**: Lines 94, 101-109, 166, 202
```typescript
// AuthContext.tsx - Line 94
const hasAuthCookie = Cookies.get('auth') || Cookies.get('supabase-auth-token');

// Lines 101-109: Parsing stale cookie data
if (authData) {
  const userData = JSON.parse(authData);
  setUser(userData); // Trusts cookie without validation!
}

// Line 166: Sets backup cookie
Cookies.set('auth', JSON.stringify(data.user), { expires: 7 });
```

**Why This Is Broken**:
- Client immediately sets `isAuthenticated = true` if ANY cookie exists
- No validation that the cookie is still valid
- If session expires on server but cookie remains, client stays authenticated
- Two different cookie formats storing different data

#### 1C. **Supabase Browser Client** (Client-side)
- Location: `src/lib/supabase/client.ts`
- Uses: Browser-specific Supabase client for real-time updates
- **PROBLEM**: Not integrated with auth context or cookie management

```typescript
// src/lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Why This Is Broken**:
- Creates new instance every time (not cached)
- Never syncs with AuthContext session state
- Not used in API calls or authentication flow
- Wasted dependency and potential source of confusion

---

## PROBLEM 2: RACE CONDITION IN LOGIN FLOW

### Sequence of Events During Login:

```
1. User submits credentials
   ↓
2. fetch('/api/auth/signin', {credentials: 'include'})
   ↓
3. Server signs in user, sets cookies in response
   ↓
4. Browser receives response
   ↓
5. Client sets 'auth' cookie with JSON.stringify(user)
   ↓
6. Client sets isAuthenticated = true
   ↓
7. Router.push('/') redirect triggered
   ↓
8. Dashboard loads, AuthGuard checks session
   ↓
9. fetch('/api/auth/session', {credentials: 'include'})
   ↓
10. Server receives request but...
```

**THE RACE CONDITION**: Between steps 3-9:
- Browser has new cookies from signin response
- But middleware hasn't run yet to refresh session
- AuthGuard simultaneously checking authentication while context is initializing
- Multiple async session checks firing at once

### Code Evidence:

**Sign-in endpoint** (`src/app/api/auth/signin/route.ts`, lines 55-62):
```typescript
// Sets explicit cookie
if (authData.session?.access_token) {
  response.cookies.set('supabase-auth-token', authData.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}
```

**Context checks session** (`src/context/AuthContext.tsx`, lines 40-82):
```typescript
const checkSession = useCallback(async () => {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });
    // Validates session...
  } catch (error) {
    // But what if request fails mid-redirect?
  }
}, [router]);
```

**Multiple checks triggered** (`src/context/AuthContext.tsx`, lines 115-120):
```typescript
// Always check the session to verify authentication properly
if (!isSigninPage) {
  setTimeout(() => {
    checkSession();
  }, 100); // 100ms delay but still can race
}
```

---

## PROBLEM 3: MISSING `credentials: 'include'` ON API CALLS

### Critical Issue: Most API Calls Don't Include Credentials

Comparing API call patterns in the codebase:

**WITH `credentials: 'include'`** (Auth endpoints only):
```typescript
// src/context/AuthContext.tsx - Line 157
fetch('/api/auth/signin', {
  credentials: 'include', // ✓ CORRECT
  ...
})

// src/context/AuthContext.tsx - Line 42
fetch('/api/auth/session', {
  credentials: 'include', // ✓ CORRECT
})
```

**WITHOUT `credentials: 'include'`** (All other endpoints):
```typescript
// src/services/userService.ts - Line 61
const response = await fetch(`/api/users?${query.toString()}`, {
  cache: "no-store",
  // ✗ MISSING credentials: 'include'
});

// src/app/(admin)/projects/page.tsx - Line 136
const response = await fetch(
  `/api/projects?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  // ✗ MISSING credentials: 'include'
);

// src/app/(admin)/projects/page.tsx - Line 101
const response = await fetch(`/api/projects/${projectId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_active: newStatus }),
  // ✗ MISSING credentials: 'include'
});
```

### Why This Breaks Authentication:

Without `credentials: 'include'`, the browser **does not send cookies** with the request. This means:

1. Server receives request WITHOUT the `supabase-auth-token` cookie
2. Middleware tries to validate session: `supabase.auth.getUser()` fails
3. API route calls `requireAdmin()` which tries to get user from cookies
4. No cookies = no user = "Authentication required" error
5. Client shows 401, user reloads page
6. Page reload triggers new middleware run, cookies are re-read
7. Next request succeeds because middleware just set them

**This explains the "works on reload" symptom!**

---

## PROBLEM 4: INCONSISTENT AUTHENTICATION CHECKING ACROSS API ROUTES

### Three Different Authentication Patterns Used:

#### Pattern A: Using `requireAdmin()` Helper (CORRECT - 17 routes)
```typescript
// src/app/api/users/route.ts - Line 61
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(); // Validates & throws on auth failure
    // Safe to proceed
  } catch (error) {
    return handleApiError(error); // Proper error handling
  }
}
```

Used in: users, projects, analytics, payments, etc.

#### Pattern B: NO Authentication Check (CRITICAL BUG - 1 route)
```typescript
// src/app/api/projects/[id]/route.ts - Line 4
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();
    // NO AUTHENTICATION CHECK! 🔴
    
    return NextResponse.json(data);
  } catch (error) {
    // Returns error
  }
}
```

**Impact**: Anyone can fetch any project details without authentication!

#### Pattern C: No requireAdmin() but returns 401 for non-admin (1 route)
```typescript
// src/app/api/auth/session/route.ts - Lines 8-20
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userRole = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'administrator';

    if (!isAdmin) {
      return NextResponse.json({ user: null, error: 'Admin access required' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ user: null, error: 'Session check failed' }, { status: 500 });
  }
}
```

**Problem**: Doesn't use centralized `requireAdmin()`, duplicates auth logic.

---

## PROBLEM 5: GLOBAL SINGLETON CLIENT CACHING

### Server-Side Caching Issue:

**File**: `src/lib/supabase/server.ts` (lines 5-8, 14-16, 44-45)

```typescript
const globalForSupabase = global as typeof globalThis & {
  _supabaseServerClient?: SupabaseClient;
};

export async function createClient() {
  const cookieStore = await cookies()

  // Reuse the same client instance in both dev and production
  if (globalForSupabase._supabaseServerClient) {
    return globalForSupabase._supabaseServerClient; // 🔴 RETURNS CACHED
  }

  // ... creates client ...
  
  // Cache the client globally (both dev and production)
  globalForSupabase._supabaseServerClient = client; // 🔴 CACHES IT

  return client;
}
```

### Why This Causes Problems:

1. **First Request**: User logs in, client is created with fresh session cookies
2. **Second Request**: New cookies arrive (from middleware refresh), but...
3. **createClient() returns CACHED instance** instead of reading new cookies
4. **Cached instance still has old authentication state**
5. **API fails with "authentication required"** even though cookies are fresh

The singleton pattern is intended to improve performance, but it **prevents cookie updates** during a request's lifetime.

### The Cookie Reading Code:

```typescript
// Lines 22-24
cookies: {
  get(name: string) {
    return cookieStore.get(name)?.value // Reads from initial cookieStore
  },
```

When client is cached, `cookieStore` is frozen to the first request's state.

---

## PROBLEM 6: AUTHENTICATION FLOW DIAGRAM (BROKEN)

```
┌─────────────┐
│  User Logs  │
│     In      │
└──────┬──────┘
       │
       v
┌──────────────────────────────────────┐
│ POST /api/auth/signin                │
│ - Validates credentials              │
│ - Creates Supabase session           │
│ - Sets cookies in response           │
│ - Returns user object                │
└──────┬───────────────────────────────┘
       │
       v
┌──────────────────────────────────────┐
│ Browser Receives Response            │
│ - Gets cookies from Set-Cookie       │
│ - AuthContext login() succeeds       │
│ - Sets 'auth' cookie with JSON       │
│ - Sets isAuthenticated = true        │
└──────┬───────────────────────────────┘
       │
       v
┌──────────────────────────────────────┐
│ router.push('/') Redirects           │
│ - Loads dashboard                    │
│ - AuthGuard checks auth              │
└──────┬───────────────────────────────┘
       │
       v
┌──────────────────────────────────────┐
│ Dashboard Page Loads                 │
│ - AuthGuard calls useAuth()          │
│ - useAuth() calls checkSession()     │
│ - RACE: Multiple checks firing       │
└──────┬───────────────────────────────┘
       │
       v
┌──────────────────────────────────────┐
│ fetch('/api/auth/session')           │
│ - No credentials: 'include' ❌       │
│ - Cookies NOT sent with request      │
│ - Server: "No user found" = 401      │
└──────┬───────────────────────────────┘
       │
   ┌───┴────┐
   │        │
   v        v
 FAIL     SUCCESS
  401      200
   │        │
   └───┬────┘
       v
┌──────────────────────────────────────┐
│ If FAIL:                             │
│ - AuthContext catches 401            │
│ - Sets isAuthenticated = false       │
│ - User kicked to signin              │
│ - But browser still has cookies!     │
│ - User reloads page                  │
│ - Middleware runs, reads cookies     │
│ - Page works on 2nd load             │
│                                      │
│ If SUCCESS (lucky timing):           │
│ - User stays logged in               │
│ - Dashboard shows data               │
└──────────────────────────────────────┘
```

---

## PROBLEM 7: MIDDLEWARE NOT CONSISTENTLY REFRESHING SESSIONS

**File**: `src/lib/supabase/middleware.ts`

```typescript
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(...)
  
  await supabase.auth.getUser() // Line 57 - Gets user but doesn't use result!
  
  return response
}
```

### Issues:

1. **Line 57 calls `getUser()` but doesn't store the result**
   - Result is discarded
   - Auth state is verified but not exposed to route handlers

2. **Cookies are set in response but not reliably**
   - The `set()` method creates a NEW response object (line 25)
   - If multiple cookie operations occur, only the last `response` is returned
   - Previous updates might be lost

3. **Middleware runs on EVERY request but:**
   - It doesn't run on API requests (because of matcher config, line 23: `'/api'` is allowed through)
   - Wait, actually checking config...

Looking at matcher config (`src/middleware.ts`, lines 31-41):
```typescript
export const config = {
  matcher: [
    // Match all requests EXCEPT static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**This runs middleware on ALL routes including `/api`**, which is correct. But then in the middleware itself:

```typescript
// Lines 23-26
if (
  pathname.startsWith('/signin') || 
  pathname.startsWith('/signup') || 
  pathname.startsWith('/error-404') ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api') // 🔴 API requests just get the response!
) {
  return response
}
```

**So middleware DOES run on API but just returns the response without any special handling.**

---

## PROBLEM 8: CLIENT-SIDE SESSION VALIDATION TIMING

**File**: `src/context/AuthContext.tsx`

### The Problematic Flow (Lines 85-126):

```typescript
useEffect(() => {
  if (mounted) {
    // Check for cookie-based auth first
    const hasAuthCookie = Cookies.get('auth') || Cookies.get('supabase-auth-token');

    if (hasAuthCookie) {
      // PROBLEM 1: Immediately trusts cookie
      setIsAuthenticated(true);
      
      // PROBLEM 2: Sets user from cookie without validation
      try {
        const authData = Cookies.get('auth');
        if (authData) {
          const userData = JSON.parse(authData);
          setUser(userData); // Stale data!
        }
      } catch (e) {
        console.error('Error parsing auth cookie:', e);
      }

      // PROBLEM 3: Sets loading to false prematurely
      setLoading(false);
    }

    // PROBLEM 4: Always verifies later but race condition occurs
    if (!isSigninPage) {
      setTimeout(() => {
        checkSession();
      }, 100); // Arbitrary timeout
    }
  }
}, [mounted, checkSession]);
```

### Why This Is Broken:

1. **Immediate trust of stale cookies**: If session expires on server but cookie still exists locally, client wrongly shows authenticated
2. **Race condition with setTimeout**: 100ms delay is arbitrary and can race with component renders
3. **Two different states**: `isAuthenticated` and `user` can become out of sync
4. **No retry logic**: If checkSession fails, AuthContext doesn't retry

---

## PROBLEM 9: PERIODIC SESSION VERIFICATION DOESN'T HELP

**File**: `src/context/AuthContext.tsx` (Lines 128-146)

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
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(intervalId);
}, [mounted, isAuthenticated, checkSession]);
```

### Problems:

1. **5-minute interval is too long**: Session can expire in between checks
2. **Only runs if `isAuthenticated` is already true**: Dead code when user logs in on dashboard
3. **Doesn't help with API calls**: API calls that are missing `credentials: 'include'` will still fail regardless

---

## COMPLETE AUTHENTICATION FLOW (CORRECT IMPLEMENTATION)

The flow SHOULD be:

```
1. User submits login form
   ↓
2. POST /api/auth/signin WITH credentials: 'include'
   ↓
3. Middleware INTERCEPTS, verifies incoming cookies
   ↓
4. Server creates session, sets Set-Cookie headers
   ↓
5. Browser receives response with Set-Cookie
   ↓
6. Context stores user data in state AND localStorage
   ↓
7. All subsequent API calls use credentials: 'include'
   ↓
8. Server receives cookies automatically in every request
   ↓
9. Middleware verifies session on EVERY request
   ↓
10. If session invalid, middleware doesn't set it in response
   ↓
11. All API routes use centralized requireAdmin() check
   ↓
12. Consistent auth state across server and client
```

Current implementation:
- Missing `credentials: 'include'` on most calls
- Multiple cookie formats
- Client trusts cookies without validation
- Server caches stale auth state
- Race conditions on auth checks

---

## API ROUTE AUTHENTICATION AUDIT

### Routes Using `requireAdmin()` (CORRECT) - 17 Routes:

✓ `/api/users/route.ts` - GET, POST
✓ `/api/users/[id]/route.ts` - GET, PATCH, DELETE
✓ `/api/users/[id]/projects/route.ts` - GET
✓ `/api/users/[id]/invoices/route.ts` - GET (if it exists)
✓ `/api/users/[id]/blogs/route.ts` - GET
✓ `/api/users/[id]/usage/route.ts` - GET
✓ `/api/projects/route.ts` - GET
✓ `/api/projects/recent/route.ts` - GET
✓ `/api/projects/[id]/status/route.ts` - PATCH
✓ `/api/analytics/metrics/route.ts` - GET
✓ `/api/analytics/active-users/route.ts` - GET
✓ `/api/analytics/user-growth/route.ts` - GET
✓ `/api/analytics/project-growth/route.ts` - GET (needs verification)
✓ `/api/analytics/blogs-growth/route.ts` - GET (needs verification)
✓ `/api/blogs/recent/route.ts` - GET
✓ `/api/payments/recent/route.ts` - GET

### Routes With MISSING Authentication (BUG) - 1 Route:

❌ `/api/projects/[id]/route.ts` - GET
   - No authentication check at all!
   - Returns full project details to ANY user
   - Should have: `await requireAdmin();` at start

### Routes With Custom Auth Check (Inconsistent) - 1 Route:

⚠️ `/api/auth/session/route.ts` - GET
   - Duplicates auth logic instead of using requireAdmin()
   - Should use `await requireAdmin();` like others

### Auth Routes (Exception, No requireAdmin needed) - 2 Routes:

◆ `/api/auth/signin/route.ts` - POST
   - Public endpoint (no auth required)
   - Validates admin role AFTER sign-in

◆ `/api/auth/signout/route.ts` - POST
   - Public endpoint (allows any user to log out)
   - Should probably verify user exists first

---

## API CALLS WITHOUT `credentials: 'include'` (BUG LIST)

### Client-Side Service Layer:

**src/services/userService.ts:**
- Line 61: `getUsers()` - fetch without credentials
- Line 84: `getUserById()` - fetch without credentials  
- Line 105: `createUser()` - fetch without credentials
- Line 130: `updateUser()` - fetch without credentials
- Line 148: `deleteUser()` - fetch without credentials

**Total: 5 functions affected**

### React Components:

**src/app/(admin)/projects/page.tsx:**
- Line 136: fetch projects - NO credentials
- Line 101: fetch project status update - NO credentials

**src/app/(admin)/user/[user_id]/page.tsx:**
- (Likely has similar issues, would need to verify UserList component calls)

**Total: 2 component calls affected (likely more in UserList)**

### Why Projects Page Works Sometimes:

Looking at projects page component (line 136):
```typescript
const response = await fetch(
  `/api/projects?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
);
```

This works intermittently because:
1. After page load, middleware has just set cookies
2. Browser's automatic cookie handling sends cookies anyway (sometimes)
3. But without explicit `credentials: 'include'`, it's relying on browser defaults
4. Browser defaults to NOT sending cross-site cookies unless specified

**The "sometimes works, sometimes doesn't" is actually undefined behavior.**

---

## COOKIE INCONSISTENCIES

### Three Cookie Formats In Use:

1. **Supabase default cookies** (automatic from server)
   - Set by: `supabaseAdmin.auth.signInWithPassword()`
   - Names: Various (sb-*, sb_*, etc. depending on Supabase version)
   - Format: Opaque tokens managed by Supabase

2. **Custom `supabase-auth-token` cookie** (custom set)
   - Set by: `/api/auth/signin/route.ts` lines 56-63
   - Format: Raw access token string
   - Purpose: Explicit auth token for API calls
   - **PROBLEM**: Duplicates what Supabase already does

3. **Custom `auth` cookie** (custom set)
   - Set by: `AuthContext.tsx` lines 53, 166
   - Format: JSON stringified user object
   - Purpose: Client-side user state persistence
   - **PROBLEM**: Stores stale data, no expiration logic

### Why Multiple Cookies Break Things:

- If any ONE cookie expires or is deleted, auth state becomes inconsistent
- Different parts of the code read different cookies
- Cookie synchronization is not coordinated
- **Cleanup on logout** (`AuthContext.tsx` lines 201-202):
  ```typescript
  Cookies.remove('auth');
  Cookies.remove('supabase-auth-token');
  ```
  But doesn't clear Supabase's automatic cookies

---

## SUMMARY OF ROOT CAUSES

| Issue | Location | Type | Impact |
|-------|----------|------|--------|
| Missing `credentials: 'include'` | userService.ts, page.tsx | Critical | Cookies not sent with API requests |
| Global client caching | server.ts | Critical | Stale auth state on subsequent requests |
| Multiple auth methods uncoordinated | Multiple files | Critical | Inconsistent state across app |
| Race condition on login | AuthContext.tsx | High | Auth checks fire before session ready |
| Stale cookie trust | AuthContext.tsx line 94-109 | High | Auth state wrong when session expires |
| No auth on projects/{id} GET | projects/[id]/route.ts | Critical | Unprotected API endpoint |
| Duplicated auth logic | auth/session/route.ts | Medium | Inconsistent error handling |
| Session verification too infrequent | AuthContext.tsx | Medium | Expired sessions not detected |

---

## DETAILED FIXES REQUIRED

### FIX 1: Add `credentials: 'include'` to All API Calls

**File: `src/services/userService.ts`**
```typescript
// All fetch calls need:
const response = await fetch(url, {
  method: 'GET|POST|PATCH|DELETE',
  credentials: 'include', // ADD THIS
  headers: {...},
  body: {...}
});
```

**File: `src/app/(admin)/projects/page.tsx`**
```typescript
// Line 136 - Add credentials
const response = await fetch(
  `/api/projects?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  { credentials: 'include' } // ADD THIS
);

// Line 101 - Add credentials
const response = await fetch(`/api/projects/${projectId}/status`, {
  method: 'PATCH',
  credentials: 'include', // ADD THIS
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_active: newStatus }),
});
```

**File: `src/components/users/UserList.tsx`** (if making fetch calls directly)
- Add `credentials: 'include'` to all fetch calls

### FIX 2: Remove Global Client Caching

**File: `src/lib/supabase/server.ts`**

Remove lines 5-8, 14-16, 44-45:
```typescript
// DELETE THIS:
const globalForSupabase = global as typeof globalThis & {
  _supabaseServerClient?: SupabaseClient;
};

// CHANGE THIS:
if (globalForSupabase._supabaseServerClient) {
  return globalForSupabase._supabaseServerClient;
}

// CHANGE THIS:
globalForSupabase._supabaseServerClient = client;

// NEW VERSION:
export async function createClient() {
  const cookieStore = await cookies()

  // ALWAYS create fresh client - don't cache
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
            // Ignore cookie errors in read-only contexts
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore cookie errors
          }
        },
      },
    }
  )

  return client;
}
```

### FIX 3: Add Missing Auth Check to Project Endpoint

**File: `src/app/api/projects/[id]/route.ts`**

```typescript
import { handleApiError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(); // ADD THIS - Verify authentication
    
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
    return handleApiError(error); // CHANGE THIS
  }
}
```

### FIX 4: Consolidate Authentication Checking

**File: `src/app/api/auth/session/route.ts`**

Change from:
```typescript
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    const userRole = (user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'administrator';
    
    if (!isAdmin) {
      return NextResponse.json({ user: null, error: 'Admin access required' }, { status: 403 });
    }
    // ...
  } catch (error) {
    return NextResponse.json({ user: null, error: 'Session check failed' }, { status: 500 });
  }
}
```

To:
```typescript
import { requireAdmin, handleApiError } from "@/lib/auth/requireAdmin";

export async function GET() {
  try {
    const user = await requireAdmin(); // Consolidate auth check
    
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

### FIX 5: Improve Client-Side Session Validation

**File: `src/context/AuthContext.tsx`**

Change lines 85-126:
```typescript
useEffect(() => {
  if (mounted) {
    const isSigninPage = typeof window !== 'undefined' && (
      window.location.pathname.includes('/signin') ||
      window.location.pathname.includes('/login')
    );

    // Don't show cached state - always verify with server
    if (isSigninPage) {
      setLoading(false);
    } else {
      // Always check session immediately, don't trust cookies
      checkSession();
    }
  }
}, [mounted, checkSession]);
```

Change lines 128-146 to retry on failure:
```typescript
useEffect(() => {
  if (!mounted || isLoading) return;

  const isSigninPage = typeof window !== 'undefined' && (
    window.location.pathname.includes('/signin') ||
    window.location.pathname.includes('/login')
  );

  if (isSigninPage) return;

  // Set up periodic session verification (every 30 seconds for better reliability)
  const intervalId = setInterval(() => {
    checkSession();
  }, 30 * 1000); // 30 seconds instead of 5 minutes

  return () => clearInterval(intervalId);
}, [mounted, isLoading, checkSession]);
```

### FIX 6: Consolidate Cookie Strategy

**File: `src/context/AuthContext.tsx`**

Remove the dual-cookie approach. Keep only ONE format:
```typescript
// Only use one 'auth' cookie format
const checkSession = useCallback(async () => {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include', // MUST include
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        // Single cookie source of truth
        Cookies.set('auth', JSON.stringify(data.user), { expires: 7 });
      } else {
        throw new Error('No user in response');
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      Cookies.remove('auth');
    }
  } catch (error) {
    setUser(null);
    setIsAuthenticated(false);
    Cookies.remove('auth');
    // Don't redirect on every error, only on 401
    if (error instanceof Error && error.message.includes('401')) {
      router.push('/signin?session=expired');
    }
  } finally {
    setLoading(false);
  }
}, [router]);
```

Remove the pre-loading of stale cookies (lines 94-113):
```typescript
// DELETE THIS ENTIRE BLOCK:
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

// ALWAYS check session properly - don't trust cookies
if (!isSigninPage) {
  setTimeout(() => {
    checkSession();
  }, 100);
} else {
  setLoading(false);
}
```

---

## TESTING CHECKLIST TO VERIFY FIXES

- [ ] User logs in, dashboard loads without page reload
- [ ] User logs in, closes browser, reopens - still logged in
- [ ] User logs in, API calls work immediately without reload
- [ ] Session expires on server, next API call redirects to login
- [ ] User loads dashboard, logs out, can immediately log back in
- [ ] Multiple tabs: logout in tab A, tab B shows logout after 30 seconds
- [ ] Network slowness: login takes 2 seconds, still works correctly
- [ ] Page refresh during login: doesn't break state
- [ ] Rapid API calls: all include credentials
- [ ] Projects endpoint `/api/projects/[id]` requires authentication

---

## DEPLOYMENT NOTES

1. **Test thoroughly before deploying** - auth changes are critical
2. **Monitor error logs** - 401 errors should decrease significantly
3. **Gradual rollout** - use feature flags if possible
4. **User communication** - sessions may briefly require re-authentication during transition
5. **Database** - no schema changes needed, only app logic

---


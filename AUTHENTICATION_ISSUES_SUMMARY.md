# Authentication Issues - Quick Reference

## The Core Problem in 3 Sentences

1. **Missing credentials**: Most API calls don't send cookies with requests (`credentials: 'include'` missing)
2. **Stale server state**: Server-side Supabase client is cached globally, so it doesn't see fresh cookies
3. **Race conditions**: Client tries to authenticate before server has set new cookies, causing intermittent failures

---

## Why You See "Sometimes Works, Sometimes Doesn't"

```
SCENARIO 1: Works (By Luck)
├─ User logs in
├─ Browser gets cookies from response
├─ AuthGuard checks session immediately
├─ Middleware just ran, cookies are fresh
├─ API accepts request
└─ Dashboard loads ✓

SCENARIO 2: Fails (Race Condition)
├─ User logs in
├─ Browser gets cookies from response
├─ But AuthGuard checks before middleware
├─ OR API call missing credentials: 'include'
├─ Server doesn't receive cookies
├─ API returns 401 "authentication required"
├─ User reloads page manually
├─ Page 2: Middleware has run now
├─ Dashboard loads ✓
```

---

## 9 Critical Issues Found

### 1. **Missing `credentials: 'include'` on API Calls** [CRITICAL]
- **File**: `src/services/userService.ts` (5 functions)
- **File**: `src/app/(admin)/projects/page.tsx` (2 calls)
- **Impact**: Cookies never sent with requests, 401 errors on every API call
- **Fix**: Add `credentials: 'include'` to fetch options

### 2. **Global Singleton Client Caching** [CRITICAL]
- **File**: `src/lib/supabase/server.ts` (lines 5-8, 14-16, 44-45)
- **Impact**: Server reuses stale auth client, doesn't see fresh cookies
- **Fix**: Remove caching, create fresh client on each request

### 3. **Multiple Authentication Methods** [CRITICAL]
- **Files**: `server.ts`, `AuthContext.tsx`, `client.ts`
- **Impact**: Three different auth systems competing, state always out of sync
- **Fix**: Use single auth method (Supabase SSR)

### 4. **Client Trusts Stale Cookies** [HIGH]
- **File**: `src/context/AuthContext.tsx` (lines 94-109)
- **Impact**: If server invalidates session, client still thinks user is logged in
- **Fix**: Always validate cookies with server, don't trust local copies

### 5. **Unprotected Project Endpoint** [CRITICAL]
- **File**: `src/app/api/projects/[id]/route.ts`
- **Impact**: Anyone can access any project's details without authentication
- **Fix**: Add `await requireAdmin()` at start of GET handler

### 6. **Duplicate Authentication Logic** [MEDIUM]
- **File**: `src/app/api/auth/session/route.ts`
- **Impact**: Different error handling than other endpoints, inconsistent behavior
- **Fix**: Use centralized `requireAdmin()` helper

### 7. **Race Condition on Login** [HIGH]
- **File**: `src/context/AuthContext.tsx` (lines 115-120)
- **Impact**: Auth checks fire before session is established, random failures
- **Fix**: Ensure middleware runs before auth checks, remove arbitrary timeouts

### 8. **Infrequent Session Verification** [MEDIUM]
- **File**: `src/context/AuthContext.tsx` (lines 128-146)
- **Impact**: Session expires but client keeps trying for up to 5 minutes
- **Fix**: Check session every 30 seconds instead of 5 minutes

### 9. **Multiple Cookie Formats** [MEDIUM]
- **Cookies**: `auth` (JSON), `supabase-auth-token` (token), `sb-*` (Supabase auto)
- **Impact**: Inconsistent state when one cookie expires differently than others
- **Fix**: Use single cookie format managed by Supabase

---

## Impact by Symptom

| What You See | Root Cause |
|--------------|-----------|
| "Authentication required" error on first load | #1: Missing `credentials: 'include'` |
| Works when you reload the page | #2: Stale cached client gets refreshed |
| Auth works for 5 minutes then breaks | #8: Session expires undetected |
| Can access project details without login | #5: Unprotected endpoint |
| Sometimes logged out unexpectedly | #4: Trusting stale cookies |
| Dashboard loads but shows no data | #1 + #2: Cookies not sent, stale state |

---

## Quick Fix Priority

### IMMEDIATE (Do First)
1. **Fix #1**: Add `credentials: 'include'` to all API calls
   - 5 minutes work
   - Fixes 80% of "authentication required" errors

2. **Fix #2**: Remove global client caching in `server.ts`
   - 5 minutes work
   - Prevents stale auth state

3. **Fix #5**: Add auth check to `projects/[id]` endpoint
   - 2 minutes work
   - Closes security hole

### SHORT TERM (This Sprint)
4. **Fix #3**: Remove unused `supabase/client.ts` browser client
5. **Fix #6**: Consolidate auth logic in session endpoint
6. **Fix #9**: Standardize on single cookie format

### MEDIUM TERM (Next Sprint)
7. **Fix #4**: Remove pre-loading of stale cookies
8. **Fix #7**: Simplify auth flow without arbitrary timeouts
9. **Fix #8**: More frequent session checks (30s instead of 5min)

---

## Files That Need Changes

| File | Changes | Priority |
|------|---------|----------|
| `src/services/userService.ts` | Add `credentials: 'include'` to 5 fetch calls | IMMEDIATE |
| `src/app/(admin)/projects/page.tsx` | Add `credentials: 'include'` to 2 fetch calls | IMMEDIATE |
| `src/lib/supabase/server.ts` | Remove global caching (delete 13 lines) | IMMEDIATE |
| `src/app/api/projects/[id]/route.ts` | Add `await requireAdmin()` at line 8 | IMMEDIATE |
| `src/app/api/auth/session/route.ts` | Use `requireAdmin()` helper | SHORT TERM |
| `src/context/AuthContext.tsx` | Remove stale cookie pre-loading | MEDIUM TERM |
| `src/lib/supabase/client.ts` | Remove unused file | SHORT TERM |

---

## Testing After Fixes

```
[ ] User logs in → dashboard loads without reload
[ ] User logs in, closes tab, reopens → still logged in
[ ] User makes API calls immediately after login → no 401
[ ] Session expires → next API call redirects to login
[ ] Logout in tab A → tab B logs out within 30 seconds
[ ] Slow network (2s signin) → works correctly
[ ] Rapid API calls → all include credentials
[ ] Project endpoint `/api/projects/[id]` → requires auth
```

---

## Root Cause Analysis

**Why did this happen?**

The authentication system was built incrementally without a clear ownership:

1. Started with Supabase's official SSR pattern (`server.ts`, `middleware.ts`)
2. Added custom context-based auth for better UX (`AuthContext.tsx`)
3. Added custom cookie management to persist state (`auth` cookie)
4. Added explicit token cookie for API calls (`supabase-auth-token` cookie)
5. Each addition was meant to "fill a gap" but never fully integrated
6. Missing `credentials: 'include'` was overlooked on the service layer
7. Caching in `server.ts` was added for "performance" without testing auth refresh

**Result**: Three authentication systems running in parallel, none of them completely reliable.

---

## Going Forward

After fixes:
- ✓ Use only **Supabase SSR** for server-side auth
- ✓ Use only **AuthContext** for client state management
- ✓ Use only **one cookie format** (Supabase default)
- ✓ Always use `credentials: 'include'` on API calls
- ✓ Never cache server clients
- ✓ Always verify cookies with server, never trust local state

# RAYO-SENSE V2 - COMPREHENSIVE DEEP ANALYSIS REPORT

**Generated:** August 12, 2025  
**Project:** Rayo-Sense Admin Dashboard  
**Version:** 2.0.2

---

## 📋 EXECUTIVE SUMMARY

Rayo-Sense is a **full-stack admin dashboard** built with modern web technologies. It serves as a management panel for a SaaS platform, allowing administrators to manage users, projects, blogs, and track payments/analytics.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 15.2.3 |
| **Frontend** | React | 19.0.0 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.0.0 |
| **Primary Database** | Supabase (PostgreSQL) | Latest |
| **Secondary Database** | MongoDB | 7.0.0 |
| **Authentication** | Supabase Auth | 2.80.0 |
| **Payment Integration** | Razorpay | - |
| **Charts** | ApexCharts | 4.3.0 |
| **Avatar Generation** | DiceBear | 9.2.4 |

---

## 🔐 AUTHENTICATION SYSTEM (Deep Dive)

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User visits /signin                                         │
│           ↓                                                     │
│  2. SignInForm.tsx renders login form                          │
│           ↓                                                     │
│  3. User submits email/password                                │
│           ↓                                                     │
│  4. POST /api/auth/signin                                      │
│           ↓                                                     │
│  5. Supabase validates credentials                             │
│           ↓                                                     │
│  6. Check user_metadata.role OR app_metadata.role              │
│           ↓                                                     │
│  7. If role !== 'admin' → 403 Forbidden                        │
│           ↓                                                     │
│  8. Set httpOnly cookie (supabase-auth-token)                  │
│           ↓                                                     │
│  9. AuthContext updates state (isAuthenticated, user)          │
│           ↓                                                     │
│  10. Redirect to Dashboard (/)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Authentication Files

#### 1. `src/context/AuthContext.tsx` (242 lines)
**Purpose:** Global authentication state management

**Key Features:**
- `isAuthenticated` - Boolean auth state
- `user` - Current user object (id, email, name, role, avatar)
- `login()` - Async function to authenticate
- `logout()` - Async function to sign out
- `loading` - Loading state during auth operations
- Session polling every 30 seconds
- Cookie-based session persistence (7-day expiry)
- Optimistic UI updates from cached cookies

**Code Pattern:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  created_at?: string;
}

// Session check with backend
const checkSession = useCallback(async () => {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  });
  // Handle response...
}, [router]);
```

#### 2. `src/app/api/auth/signin/route.ts`
**Purpose:** Server-side login endpoint

**Key Logic:**
```typescript
// Admin role verification
const userRole = (authData.user?.user_metadata?.role || 
                  authData.user?.app_metadata?.role || '').toLowerCase();

if (userRole !== 'admin' && userRole !== 'administrator') {
  await supabase.auth.signOut();
  return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
  );
}
```

#### 3. `src/lib/auth/requireAdmin.ts`
**Purpose:** API route protection middleware

**Usage in every protected API:**
```typescript
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(); // Throws if not admin
    // ... rest of handler
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 4. `middleware.ts`
**Purpose:** Next.js middleware for session management

**Runs on:** Every request (except static files)
**Actions:** Updates Supabase session, manages cookies

---

## 🗄️ DATABASE ARCHITECTURE (Deep Dive)

### Supabase (PostgreSQL) - Primary Database

#### Tables Structure

```sql
-- auth.users (Supabase Auth built-in)
┌─────────────────────────────────────────────────────────────┐
│ auth.users                                                  │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ email           VARCHAR UNIQUE                              │
│ user_metadata   JSONB {name, full_name, avatar_url, role}  │
│ app_metadata    JSONB {role, provider}                     │
│ created_at      TIMESTAMP                                   │
│ last_sign_in_at TIMESTAMP                                   │
│ email_confirmed_at TIMESTAMP                                │
└─────────────────────────────────────────────────────────────┘

-- projects
┌─────────────────────────────────────────────────────────────┐
│ projects                                                    │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ name            VARCHAR                                     │
│ url             VARCHAR                                     │
│ user_id         UUID REFERENCES auth.users(id)             │
│ created_at      TIMESTAMP                                   │
│ updated_at      TIMESTAMP                                   │
│ is_active       BOOLEAN DEFAULT true                        │
└─────────────────────────────────────────────────────────────┘

-- accounts (Billing/Subscription)
┌─────────────────────────────────────────────────────────────┐
│ accounts                                                    │
├─────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY                        │
│ user_id             UUID REFERENCES auth.users(id)         │
│ plan_type           VARCHAR ('free', 'pro')                │
│ plan_status         VARCHAR ('active', 'expired', etc.)    │
│ plan_start_date     TIMESTAMP                               │
│ plan_end_date       TIMESTAMP                               │
│ balance             DECIMAL                                 │
│ total_spent         DECIMAL                                 │
│ credits             INTEGER                                 │
│ currency            VARCHAR ('INR', 'USD')                 │
│ billing_name        VARCHAR                                 │
│ billing_email       VARCHAR                                 │
│ billing_phone       VARCHAR                                 │
│ billing_address     TEXT                                    │
│ billing_city        VARCHAR                                 │
│ billing_state       VARCHAR                                 │
│ billing_country     VARCHAR                                 │
│ billing_postal_code VARCHAR                                 │
│ billing_tax_number  VARCHAR                                 │
└─────────────────────────────────────────────────────────────┘

-- gsc_accounts (Google Search Console)
┌─────────────────────────────────────────────────────────────┐
│ gsc_accounts                                                │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ project_id      UUID REFERENCES projects(id)               │
│ [GSC connection data]                                       │
└─────────────────────────────────────────────────────────────┘

-- razorpay_payments
┌─────────────────────────────────────────────────────────────┐
│ razorpay_payments                                           │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ user_id         UUID REFERENCES auth.users(id)             │
│ amount          INTEGER (in paise/cents)                   │
│ currency        VARCHAR                                     │
│ status          VARCHAR ('captured', 'pending', etc.)      │
│ created_at      TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
```

### MongoDB - Secondary Database

**Database:** `rayodb`

#### Collections

```javascript
// blogs collection
{
  _id: ObjectId,
  title: String,
  user_id: String,           // Reference to Supabase user
  project_id: String,        // Reference to projects table
  created_at: ISODate,
  updated_at: ISODate,
  word_count: Number,
  status: String,            // "creating", "completed", "failed"
  is_active: Boolean,        // Soft delete flag
  // ... content fields
}
```

### Database Connection Files

#### `src/lib/mongodb.ts`
```typescript
// Connection pooling configuration
const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true
};

// Development: Global variable for HMR
// Production: New client per instance
```

#### `src/lib/supabase/server.ts`
```typescript
// Server-side Supabase client with cookie handling
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get, set, remove } }
  );
}
```

---

## 🛣️ API ROUTES (Complete Reference)

### Authentication APIs

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/signin` | User login | No |
| POST | `/api/auth/signout` | User logout | Yes |
| GET | `/api/auth/session` | Get current session | Yes |

### User Management APIs

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/users` | List users (paginated, searchable) | Admin |
| POST | `/api/users` | Create new user | Admin |
| GET | `/api/users/[id]` | Get user details + billing + projects | Admin |
| PATCH | `/api/users/[id]` | Update user | Admin |
| DELETE | `/api/users/[id]` | Delete user | Admin |
| GET | `/api/users/[id]/blogs` | Get user's blogs | Admin |
| GET | `/api/users/[id]/projects` | Get user's projects | Admin |
| GET | `/api/users/[id]/invoices` | Get user's invoices | Admin |
| GET | `/api/users/[id]/usage` | Get user's usage data | Admin |

### Project APIs

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/projects` | List projects | Admin |
| POST | `/api/projects` | Create project | Admin |
| GET | `/api/projects/recent` | Recent 10 projects | Admin |
| GET | `/api/projects/[id]` | Get project details | Admin |
| PATCH | `/api/projects/[id]` | Update project | Admin |
| DELETE | `/api/projects/[id]` | Delete project | Admin |
| GET | `/api/projects/[id]/status` | Get project status | Admin |

### Blog APIs

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/blogs/list` | List blogs (MongoDB) | Admin |
| GET | `/api/blogs/recent` | Recent 10 blogs | Admin |
| GET | `/api/blogs/[id]` | Get blog details | Admin |
| POST | `/api/blogs/[id]/delete` | Soft delete blog | Admin |
| POST | `/api/blogs/[id]/restore` | Restore deleted blog | Admin |

### Analytics APIs

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/analytics/metrics` | Dashboard KPIs | Admin |
| GET | `/api/analytics/active-users` | Active users data | Admin |
| GET | `/api/analytics/user-growth` | User growth over time | Admin |
| GET | `/api/analytics/blogs-growth` | Blog creation growth | Admin |
| GET | `/api/analytics/project-growth` | Project creation growth | Admin |

### Payment APIs

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/payments/recent` | Recent Razorpay transactions | Admin |

---

## 🧩 COMPONENT ARCHITECTURE (Deep Dive)

### Component Hierarchy

```
src/components/
├── auth/
│   ├── AuthGuard.tsx          # Route protection wrapper
│   └── SignInForm.tsx         # Login form component
│
├── layout/
│   └── AdminLayoutClient.tsx  # Main admin layout wrapper
│
├── users/
│   ├── UserList.tsx           # User management table (main)
│   ├── EditUserModal.tsx      # Edit user dialog
│   ├── DeleteUserModal.tsx    # Delete confirmation dialog
│   ├── InviteUserModal.tsx    # Create user dialog
│   └── UserForm.tsx           # Reusable user form
│
├── blogs/
│   ├── BlogsList.tsx          # Blog management table
│   └── bloglist.tsx           # Alternative blog list
│
├── dashboard/
│   ├── ActiveUsers.tsx        # Active users widget
│   ├── BlogsGrowth.tsx        # Blogs growth chart
│   ├── ProjectGrowth.tsx      # Projects growth chart
│   └── RecentActivity.tsx     # Recent activity feed
│
├── ecommerce/
│   ├── EcommerceMetrics.tsx   # KPI cards (users, payments)
│   ├── MonthlySalesChart.tsx  # Sales chart
│   └── RecentOrders.tsx       # Recent orders table
│
├── user-profile/
│   ├── BillingInformation.tsx # Billing details display
│   ├── UserInformation.tsx    # User info display
│   ├── UserBlogs.tsx          # User's blogs list
│   ├── UserProjects.tsx       # User's projects list
│   ├── UserInvoices.tsx       # User's invoices
│   └── UserUsage.tsx          # Usage statistics
│
├── ui/                        # Reusable UI components
│   ├── table/
│   │   └── index.tsx          # Table, TableHeader, TableBody, etc.
│   ├── modal/
│   │   └── index.tsx          # Modal dialog component
│   ├── button/
│   │   └── Button.tsx         # Button component
│   ├── badge/
│   │   └── Badge.tsx          # Badge/tag component
│   ├── avatar/
│   │   ├── Avatar.tsx         # Avatar image component
│   │   └── AvatarText.tsx     # Text avatar component
│   ├── alert/
│   │   └── Alert.tsx          # Alert/notification component
│   ├── dropdown/
│   │   ├── Dropdown.tsx       # Dropdown menu
│   │   └── DropdownItem.tsx   # Dropdown item
│   ├── skeleton.tsx           # Loading skeleton
│   ├── table-skeleton.tsx     # Table loading state
│   └── Pagination.tsx         # Pagination component
│
├── form/
│   ├── input/
│   │   ├── InputField.tsx     # Text input
│   │   ├── TextArea.tsx       # Textarea
│   │   ├── FileInput.tsx      # File upload
│   │   ├── Checkbox.tsx       # Checkbox
│   │   └── Radio.tsx          # Radio button
│   ├── group-input/
│   │   └── PhoneInput.tsx     # Phone with country code
│   ├── switch/
│   │   └── Switch.tsx         # Toggle switch
│   ├── date-picker.tsx        # Date picker (flatpickr)
│   ├── Label.tsx              # Form label
│   ├── Select.tsx             # Select dropdown
│   └── MultiSelect.tsx        # Multi-select
│
└── common/
    ├── ChartTab.tsx           # Chart tab switcher
    ├── ComponentCard.tsx      # Card wrapper
    ├── GridShape.tsx          # Grid background
    ├── PageBreadCrumb.tsx     # Breadcrumb navigation
    ├── ThemeToggleButton.tsx  # Dark/light mode toggle
    └── ThemeTogglerTwo.tsx    # Alternative theme toggle
```

### Key Component Deep Dives

#### UserList.tsx (Main User Management)

**Features:**
- Paginated user table with search
- Real-time search with 500ms debounce
- Copy user ID to clipboard
- Edit/Delete user modals
- Provider icons (Google, LinkedIn, Email)
- Responsive design with mobile support

**State Management:**
```typescript
const [users, setUsers] = useState<User[]>([]);
const [pagination, setPagination] = useState<PaginationInfo>({...});
const [isLoading, setIsLoading] = useState(true);
const [searchInput, setSearchInput] = useState("");
const [userToEdit, setUserToEdit] = useState<User | null>(null);
const [userToDelete, setUserToDelete] = useState<User | null>(null);
```

**Key Functions:**
- `fetchUsers(page, search, limit)` - API call with pagination
- `handleUserUpdated()` - Update user via API
- `handleDeleteUser()` - Delete user via API
- `handlePageChange()` - Pagination navigation

#### BlogsList.tsx (Blog Management)

**Features:**
- MongoDB-backed blog listing
- Soft delete/restore functionality
- Project and user details enrichment
- Status badges (completed, creating, failed)
- Active/Deleted status indicators

**Unique Patterns:**
```typescript
// Confirmation modal for delete/restore
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [selectedBlog, setSelectedBlog] = useState<{
  id: string;
  title: string;
  action: 'delete' | 'restore';
  currentStatus: boolean;
} | null>(null);
```

#### EcommerceMetrics.tsx (Dashboard KPIs)

**Displays:**
- Free vs Pro user counts
- Total payments count
- Total payment amount (converted from paise)

**Data Fetching:**
```typescript
useEffect(() => {
  const fetchMetrics = async () => {
    const response = await fetch('/api/analytics/metrics');
    const data = await response.json();
    if (data.success) {
      setMetrics(data.data);
    }
  };
  fetchMetrics();
}, []);
```

---

## 📁 LAYOUT SYSTEM

### Layout Hierarchy

```
src/app/layout.tsx (Root)
    └── Providers (Theme, Auth, Sidebar)
        └── src/app/(admin)/layout.tsx
            └── AdminLayoutClient.tsx
                ├── AppSidebar.tsx (Left navigation)
                ├── AppHeader.tsx (Top header)
                ├── Backdrop.tsx (Mobile overlay)
                └── {children} (Page content)
```

### AppSidebar.tsx

**Navigation Items:**
```typescript
const navItems: NavItem[] = [
  { icon: <BsFillGrid3X3GapFill />, name: "Dashboard", path: "/" },
  { icon: <FaRegUserCircle />, name: "Users", path: "/user" },
  { icon: <FaCube />, name: "Projects", path: "/projects" },
  { icon: <IoDocumentTextOutline />, name: "Blogs", path: "/blogs" },
];
```

**Features:**
- Collapsible sidebar (90px collapsed, 290px expanded)
- Hover expansion
- Mobile responsive with backdrop
- Active route highlighting
- Submenu support (expandable)

### AdminLayoutClient.tsx

**Auth Protection:**
```typescript
useEffect(() => {
  if (!loading) {
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    const userRole = (user.role || '').toLowerCase();
    if (userRole !== 'admin' && userRole !== 'administrator') {
      router.push('/signin?error=admin_required');
    }
  }
}, [isAuthenticated, user, loading, router]);
```

---

## 🔧 SERVICES LAYER

### userService.ts

**Purpose:** Client-side API wrapper for user operations

**Functions:**
```typescript
// Get paginated users
getUsers({ page, limit, search }): Promise<UserListResponse>

// Get single user
getUserById(id): Promise<User>

// Create user
createUser({ email, password, metadata }): Promise<User>

// Update user
updateUser(id, { email, password, metadata }): Promise<User>

// Delete user
deleteUser(id): Promise<void>
```

**Pagination Helper:**
```typescript
const parsePagination = (payload, fallbackPage, fallbackLimit): PaginationInfo => {
  return {
    currentPage: page,
    totalPages: derivedTotalPages,
    totalUsers: total,
    limit: perPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
```

---

## 🎨 STYLING SYSTEM

### Tailwind CSS Configuration

**Custom Classes (from globals.css):**
```css
/* Menu item styles */
.menu-item { @apply flex items-center gap-3 px-4 py-3 rounded-lg; }
.menu-item-active { @apply bg-brand-50 text-brand-600; }
.menu-item-inactive { @apply text-gray-600 hover:bg-gray-50; }

/* Dark mode variants */
.dark .menu-item-active { @apply bg-brand-900/20 text-brand-400; }
```

### Color Palette

| Color | Light Mode | Dark Mode |
|-------|------------|-----------|
| Brand | `brand-500` (#primary) | `brand-400` |
| Success | `success-600` | `success-400` |
| Error | `error-600` | `error-400` |
| Warning | `warning-600` | `warning-400` |
| Gray | `gray-900` | `white` |

---

## 🔄 DATA FLOW PATTERNS

### User List Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ UserList.tsx                                                    │
│                                                                 │
│  1. Component mounts                                            │
│           ↓                                                     │
│  2. useEffect triggers fetchUsers()                            │
│           ↓                                                     │
│  3. userService.getUsers() called                              │
│           ↓                                                     │
│  4. fetch('/api/users?page=1&perPage=10')                      │
│           ↓                                                     │
│  5. API Route: requireAdmin() validates                        │
│           ↓                                                     │
│  6. supabaseAdmin.auth.admin.listUsers()                       │
│           ↓                                                     │
│  7. normalizeUser() transforms each user                       │
│           ↓                                                     │
│  8. Response: { users: [], pagination: {} }                    │
│           ↓                                                     │
│  9. setUsers(response.users)                                   │
│           ↓                                                     │
│  10. Table renders with user data                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Blog List Data Flow (Cross-Database)

```
┌─────────────────────────────────────────────────────────────────┐
│ BlogsList.tsx → /api/blogs/list                                │
│                                                                 │
│  1. Fetch blogs from MongoDB                                   │
│           ↓                                                     │
│  2. Extract unique project_ids and user_ids                    │
│           ↓                                                     │
│  3. Fetch project details from Supabase                        │
│           ↓                                                     │
│  4. Fetch user details from Supabase Auth API                  │
│           ↓                                                     │
│  5. Enrich blogs with project_details and user_details         │
│           ↓                                                     │
│  6. Return combined response                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ SECURITY IMPLEMENTATION

### Security Layers

1. **Middleware Layer** (`middleware.ts`)
   - Runs on every request
   - Updates Supabase session
   - Manages auth cookies

2. **API Protection** (`requireAdmin.ts`)
   - Every API endpoint calls `await requireAdmin()`
   - Validates Supabase session
   - Checks for admin role
   - Returns 401/403 on failure

3. **Component Protection** (`AdminLayoutClient.tsx`)
   - Checks `isAuthenticated` and `user.role`
   - Redirects to `/signin` if unauthorized

4. **Cookie Security**
   - `httpOnly: true` - No JavaScript access
   - `secure: true` (production) - HTTPS only
   - `sameSite: 'lax'` - CSRF protection
   - 7-day expiration

### Error Handling

```typescript
// Custom error class
export class AdminAccessError extends Error {
  status: number;
  constructor(message = "Admin access required", status = 401) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

// Consistent error response
export function handleApiError(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}
```

---

## 📊 ANALYTICS IMPLEMENTATION

### Dashboard Metrics

**Endpoint:** `/api/analytics/metrics`

**Data Collected:**
- Total users (paginated count from Supabase Auth)
- Free users (from accounts table where plan_type='free')
- Pro users (from accounts table where plan_type='pro')
- Total captured payments (from razorpay_payments)
- Total payment amount (sum of captured payments)

### Growth Charts

**User Growth:** `/api/analytics/user-growth`
- Aggregates user creation by date
- Returns time series data for ApexCharts

**Blog Growth:** `/api/analytics/blogs-growth`
- MongoDB aggregation pipeline
- Groups by creation date

**Project Growth:** `/api/analytics/project-growth`
- Supabase query with date grouping

---

## 🔧 UTILITY FUNCTIONS

### Avatar Generation (`src/lib/users/transform.ts`)

```typescript
// DiceBear avatar generation with caching
const generateDiceBearAvatar = (seed: string): string => {
  if (avatarCache.has(seed)) {
    return avatarCache.get(seed)!;
  }
  
  const avatar = createAvatar(adventurer, { seed });
  const dataUri = avatar.toDataUri();
  
  avatarCache.set(seed, dataUri);
  
  // Limit cache to 1000 entries
  if (avatarCache.size > 1000) {
    const firstKey = avatarCache.keys().next().value;
    avatarCache.delete(firstKey);
  }
  
  return dataUri;
};
```

### User Normalization

```typescript
export const normalizeUser = (user: User): NormalizedUser => {
  return {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0],
    email: user.email,
    role: user.user_metadata?.role || "member",
    plan: user.user_metadata?.plan || "Free",
    spend: formatCurrency(user.user_metadata?.lifetime_spend),
    lastActive: formatLastActive(user.last_sign_in_at),
    avatar: user.user_metadata?.avatar_url || generateDiceBearAvatar(user.id),
    raw: user,
  };
};
```

---

## 📁 ENVIRONMENT VARIABLES

```env
# MongoDB
MONGODB_URL=mongodb://[host]:27017
MONGODB_USERNAME=[username]
MONGODB_PASSWORD=[password]
MONGODB_DB_NAME=rayodb
MONGODB_AUTH_SOURCE=admin

# Supabase
NEXT_PUBLIC_SUPABASE_URL=[supabase_instance_url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

### Performance Optimizations
- User count caching (5-minute TTL)
- Avatar caching (1000 entries max)
- Pagination (default 10, max 50 per page)
- Image optimization via next/image
- Code splitting by route

### Missing Features (Recommendations)
- [ ] Rate limiting on API endpoints
- [ ] Audit logging for admin actions
- [ ] Error tracking (Sentry integration)
- [ ] API request signing
- [ ] Comprehensive test coverage
- [ ] Database backup automation

---

## 📋 FILE REFERENCE QUICK GUIDE

| Purpose | File Path |
|---------|-----------|
| Auth Context | `src/context/AuthContext.tsx` |
| Admin Check | `src/lib/auth/requireAdmin.ts` |
| Supabase Server | `src/lib/supabase/server.ts` |
| MongoDB Connection | `src/lib/mongodb.ts` |
| User Service | `src/services/userService.ts` |
| User Transform | `src/lib/users/transform.ts` |
| Main Layout | `src/components/layout/AdminLayoutClient.tsx` |
| Sidebar | `src/layout/AppSidebar.tsx` |
| User List | `src/components/users/UserList.tsx` |
| Blog List | `src/components/blogs/BlogsList.tsx` |
| Dashboard Metrics | `src/components/ecommerce/EcommerceMetrics.tsx` |
| Middleware | `middleware.ts` |

---

**End of Deep Analysis Report**

# RAYO-SENSE V2 CODEBASE ANALYSIS REPORT
**Project:** Rayo-Sense Admin Dashboard
**Version:** 2.0.2
**Framework:** Next.js 15.2.3 with React 19
**Analysis Date:** November 13, 2025

---

## 1. PROJECT ARCHITECTURE

### Technology Stack
- **Framework:** Next.js 15.2.3 (with App Router)
- **Frontend:** React 19.0.0
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4.0.0 with @tailwindcss/forms 0.5.9
- **UI Components:** Custom components + React Icons (5.5.0)
- **Database:** 
  - MongoDB (for blogs collection)
  - Supabase (PostgreSQL - for projects, users, accounts, user_information, gsc_accounts, razorpay_payments)
- **Authentication:** Supabase Auth with JWT tokens
- **Payment Integration:** Razorpay (payment records stored)
- **Charts & Visualization:** 
  - ApexCharts (4.3.0)
  - FullCalendar (6.1.15)
  - React JVectorMap (for world maps)
- **Additional:** Drag & drop (react-dnd 16.0.1), File upload (react-dropzone 14.3.5)

### Key Configuration Files
- **next.config.ts:** SVG support via @svgr/webpack, remote image patterns for Google & GitHub avatars
- **tsconfig.json:** Path alias @/* mapped to ./src/*, strict mode enabled
- **middleware.ts:** Session management with Supabase, auth state updates
- **tailwind.config.js:** Custom theme configuration
- **postcss.config.js:** PostCSS processing

### Environment Variables Required
```
MONGODB_URL=mongodb://[host]:27017
MONGODB_USERNAME=[username]
MONGODB_PASSWORD=[password]
MONGODB_DB_NAME=rayodb
MONGODB_AUTH_SOURCE=admin
NEXT_PUBLIC_SUPABASE_URL=[supabase_instance_url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
```

---

## 2. FOLDER STRUCTURE & ORGANIZATION

```
src/
├── app/
│   ├── (admin)/                    # Protected admin routes
│   │   ├── page.tsx               # Dashboard home
│   │   ├── user/                  # User management
│   │   │   ├── page.tsx          # User list
│   │   │   ├── [user_id]/page.tsx # User details
│   │   │   └── profile.tsx        # User profile component
│   │   ├── blogs/page.tsx         # Blog management
│   │   ├── projects/page.tsx      # Project management
│   │   └── layout.tsx             # Admin layout wrapper
│   ├── (full-width-pages)/        # Full-width layouts
│   │   ├── (auth)/signin/page.tsx # Sign-in page
│   │   ├── (error-pages)/error-404/ # 404 page
│   │   └── layout.tsx
│   ├── api/                        # API routes
│   │   ├── auth/
│   │   │   ├── signin/route.ts    # Login endpoint
│   │   │   ├── signout/route.ts   # Logout endpoint
│   │   │   └── session/route.ts   # Session check
│   │   ├── users/
│   │   │   ├── route.ts           # GET/POST users
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PATCH/DELETE user
│   │   │       ├── blogs/route.ts # Get user's blogs
│   │   │       ├── projects/route.ts # Get user's projects
│   │   │       ├── invoices/route.ts # Get user's invoices
│   │   │       └── usage/route.ts # Get user's usage data
│   │   ├── projects/
│   │   │   ├── route.ts           # GET/POST projects
│   │   │   ├── recent/route.ts    # Recent projects
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PATCH/DELETE project
│   │   │       └── status/route.ts # Project status
│   │   ├── blogs/
│   │   │   ├── route.ts           # GET blogs (MongoDB)
│   │   │   └── recent/route.ts    # Recent blogs
│   │   ├── payments/
│   │   │   └── recent/route.ts    # Recent payments (Razorpay)
│   │   └── analytics/
│   │       ├── metrics/route.ts    # Dashboard metrics
│   │       ├── active-users/route.ts # Active users
│   │       ├── user-growth/route.ts # User growth analytics
│   │       ├── blogs-growth/route.ts # Blogs growth analytics
│   │       └── project-growth/route.ts # Projects growth analytics
│   ├── layout.tsx                 # Root layout with providers
│   ├── not-found.tsx              # Global 404
│
├── components/
│   ├── auth/
│   │   ├── AuthGuard.tsx          # Auth protection wrapper
│   │   └── SignInForm.tsx         # Login form
│   ├── users/
│   │   ├── UserList.tsx           # User list component
│   │   ├── UsersTable.tsx         # User table display
│   │   └── index.ts               # Export barrel
│   ├── ui/                        # Reusable UI components
│   │   ├── table/                 # Table components
│   │   ├── modal/                 # Modal dialogs
│   │   ├── button/                # Button components
│   │   ├── badge/                 # Badge components
│   │   ├── avatar/                # Avatar components
│   │   ├── alert/                 # Alert components
│   │   ├── dropdown/              # Dropdown menus
│   │   ├── images/                # Image utilities
│   │   ├── video/                 # Video embeds
│   │   ├── Pagination.tsx         # Pagination component
│   │   ├── skeleton.tsx           # Loading skeletons
│   │   ├── table-skeleton.tsx     # Table loading state
│   │   └── modal.tsx              # Modal utilities
│   ├── dashboard/
│   │   ├── ActiveUsers.tsx        # Active users widget
│   │   ├── BlogsGrowth.tsx        # Blogs growth chart
│   │   ├── ProjectGrowth.tsx      # Projects growth chart
│   │   └── RecentActivity.tsx     # Recent activity widget
│   ├── ecommerce/
│   │   ├── EcommerceMetrics.tsx   # Metrics display
│   │   ├── MonthlySalesChart.tsx  # Sales chart
│   │   └── RecentOrders.tsx       # Recent orders
│   ├── form/
│   │   ├── input/                 # Input components
│   │   ├── form-elements/         # Form element examples
│   │   ├── group-input/
│   │   │   └── PhoneInput.tsx     # Phone input with country codes
│   │   ├── switch/                # Switch/toggle
│   │   ├── date-picker.tsx        # Date picker
│   │   └── Label.tsx              # Form labels
│   ├── layout/
│   │   └── AdminLayoutClient.tsx  # Admin layout
│   ├── tables/
│   │   ├── BasicTableOne.tsx      # Basic table
│   │   └── Pagination.tsx         # Table pagination
│   ├── user-profile/
│   │   ├── BillingInformation.tsx # Billing display
│   │   └── [other profile components]
│   ├── charts/
│   │   └── bar/                   # Bar chart components
│   ├── header/
│   │   └── [header components]
│   ├── common/
│   │   └── [common utilities]
│
├── context/
│   ├── AuthContext.tsx            # Auth state management
│   ├── ThemeContext.tsx           # Theme (dark/light mode)
│   └── SidebarContext.tsx         # Sidebar state
│
├── layout/
│   ├── AppSidebar.tsx             # Main navigation sidebar
│   ├── AppHeader.tsx              # Header component
│   ├── SidebarWidget.tsx          # Sidebar widgets
│   └── Backdrop.tsx               # Mobile menu backdrop
│
├── lib/
│   ├── mongodb.ts                 # MongoDB connection
│   ├── utils.ts                   # Utility functions
│   ├── auth/
│   │   └── requireAdmin.ts        # Admin auth middleware
│   ├── supabase/
│   │   ├── client.ts              # Client-side Supabase
│   │   ├── server.ts              # Server-side Supabase
│   │   ├── admin.ts               # Admin Supabase client
│   │   └── middleware.ts          # Middleware for auth
│   ├── users/
│   │   ├── types.ts               # User type definitions
│   │   ├── transform.ts           # User normalization
│   │   └── avatar.ts              # Avatar generation
│   └── mongodb/
│       └── [mongodb helpers]
│
├── services/
│   └── userService.ts             # User API service client
│
├── icons/
│   └── [custom SVG icons]
│
├── app.css & globals.css          # Global styles
└── middleware.ts                  # Next.js middleware

```

---

## 3. ROUTES & PAGES

### Admin Routes (Protected - Require Authentication & Admin Role)

| Route | Type | Purpose | File |
|-------|------|---------|------|
| `/` | Dashboard | Admin home with metrics | `/src/app/(admin)/page.tsx` |
| `/user` | Page | User management list | `/src/app/(admin)/user/page.tsx` |
| `/user/[user_id]` | Dynamic Page | Individual user details | `/src/app/(admin)/user/[user_id]/page.tsx` |
| `/projects` | Page | Project management | `/src/app/(admin)/projects/page.tsx` |
| `/blogs` | Page | Blog management | `/src/app/(admin)/blogs/page.tsx` |

### Public Routes

| Route | Type | Purpose | File |
|-------|------|---------|------|
| `/signin` | Auth Page | Admin sign-in | `/src/app/(full-width-pages)/(auth)/signin/page.tsx` |
| `/error-404` | Error Page | 404 not found | `/src/app/(full-width-pages)/(error-pages)/error-404/page.tsx` |

### API Routes

#### Authentication
- `POST /api/auth/signin` - User login with email/password (admin only)
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Current session check

#### Users Management
- `GET /api/users` - List all users (paginated, searchable)
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user details with billing/projects
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/users/[id]/blogs` - Get user's blogs
- `GET /api/users/[id]/projects` - Get user's projects
- `GET /api/users/[id]/invoices` - Get user's invoices
- `GET /api/users/[id]/usage` - Get user's usage data

#### Projects Management
- `GET /api/projects` - List projects (paginated, searchable)
- `POST /api/projects` - Create project
- `GET /api/projects/recent` - Recent projects
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/projects/[id]/status` - Get project status

#### Blogs Management
- `GET /api/blogs` - List blogs from MongoDB (paginated, searchable)
- `POST /api/blogs` - Create blog
- `GET /api/blogs/recent` - Recent blogs

#### Analytics
- `GET /api/analytics/metrics` - Dashboard metrics (users, payments, plans)
- `GET /api/analytics/active-users` - Active users data
- `GET /api/analytics/user-growth` - User growth over time
- `GET /api/analytics/blogs-growth` - Blog creation growth
- `GET /api/analytics/project-growth` - Project creation growth

#### Payments
- `GET /api/payments/recent` - Recent Razorpay payments

---

## 4. DATABASE & MODELS

### MongoDB Collections
**Database:** rayodb

#### blogs Collection
```javascript
{
  _id: ObjectId,
  title: String,
  user_id: String,           // Reference to Supabase user
  project_id: String,        // Reference to projects table
  created_at: ISODate,
  words_count: Number,
  status: String,            // "draft" or "published"
  // ... other fields
}
```

### Supabase Tables (PostgreSQL)

#### users (Supabase Auth)
- id (UUID)
- email
- user_metadata (contains: name, full_name, avatar_url, picture, role)
- app_metadata (contains: role for admin flag)
- created_at

#### projects
- id (UUID)
- name (String)
- url (String)
- user_id (FK to auth.users)
- created_at
- gsc_connected (derived from gsc_accounts table)

#### accounts
- id (UUID)
- user_id (FK to auth.users)
- plan_type ("free" or "pro")
- plan_duration
- plan_status ("active", "grace_period", "expired", "cancelled")
- plan_start_date
- plan_end_date
- balance (currency amount)
- total_spent (currency amount)
- credits
- currency
- billing_name
- billing_email
- billing_phone
- billing_address
- billing_city
- billing_state
- billing_country
- billing_postal_code
- billing_tax_number

#### user_information
- id (UUID)
- user_id (FK to auth.users)
- [other user info fields]

#### gsc_accounts (Google Search Console)
- id (UUID)
- project_id (FK to projects)
- [GSC connection data]

#### razorpay_payments
- id (UUID)
- user_id (FK to auth.users)
- amount (Number)
- currency (String, e.g., "INR", "USD")
- status ("captured", pending, etc.)
- [payment details]

### Data Models (TypeScript)

**User (Normalized)**
```typescript
type NormalizedUser = {
  id: string;
  name: string;
  email: string | undefined;
  role: string;
  plan: string;
  spend: string;
  lastActive: string;
  avatar: string;
  raw: SupabaseUser;
};
```

**Blog**
```typescript
interface Blog {
  id: string;
  title: string;
  project_id: string | null;
  project: Project | null;
  user_id: string | null;
  user: User | null;
  created_at: string;
  words_count: number;
  status: string;
}
```

**Project**
```typescript
interface Project {
  id: string;
  name: string;
  url: string;
  user_id: string;
  user: User;
  created_at: string;
  gsc_connected: boolean;
}
```

---

## 5. COMPONENTS

### Core UI Components
- **Button:** `/src/components/ui/button/Button.tsx`
- **Table:** `/src/components/ui/table/index.tsx` with header/body/row/cell
- **Modal:** `/src/components/ui/modal/` - dialog components
- **Pagination:** `/src/components/ui/Pagination.tsx` (new)
- **Badge:** `/src/components/ui/badge/Badge.tsx`
- **Avatar:** `/src/components/ui/avatar/Avatar.tsx`, `AvatarText.tsx`
- **Alert:** `/src/components/ui/alert/Alert.tsx`
- **Dropdown:** `/src/components/ui/dropdown/Dropdown.tsx`, `DropdownItem.tsx`
- **Skeleton:** `/src/components/ui/skeleton.tsx` (loading states)
- **TableSkeleton:** `/src/components/ui/table-skeleton.tsx`

### Form Components
- **PhoneInput:** `/src/components/form/group-input/PhoneInput.tsx` (country codes dropdown)
- **InputField:** `/src/components/form/input/InputField.tsx`
- **TextArea:** `/src/components/form/input/TextArea.tsx`
- **FileInput:** `/src/components/form/input/FileInput.tsx`
- **Checkbox:** `/src/components/form/input/Checkbox.tsx`
- **Radio:** `/src/components/form/input/Radio.tsx`, `RadioSm.tsx`
- **DatePicker:** `/src/components/form/date-picker.tsx` (flatpickr)
- **Label:** `/src/components/form/Label.tsx`
- **Switch:** `/src/components/form/switch/Switch.tsx`

### Feature Components
- **UserList:** `/src/components/users/UserList.tsx` - Main user management
- **UsersTable:** `/src/components/users/UsersTable.tsx` (new) - User table display
- **SignInForm:** `/src/components/auth/SignInForm.tsx` - Login form
- **AuthGuard:** `/src/components/auth/AuthGuard.tsx` - Route protection
- **BillingInformation:** `/src/components/user-profile/BillingInformation.tsx`

### Dashboard Components
- **EcommerceMetrics:** `/src/components/ecommerce/EcommerceMetrics.tsx` - KPI cards
- **MonthlySalesChart:** `/src/components/ecommerce/MonthlySalesChart.tsx` - ApexCharts
- **RecentOrders:** `/src/components/ecommerce/RecentOrders.tsx`
- **ActiveUsers:** `/src/components/dashboard/ActiveUsers.tsx` - Active users widget
- **BlogsGrowth:** `/src/components/dashboard/BlogsGrowth.tsx` - Blogs analytics chart
- **ProjectGrowth:** `/src/components/dashboard/ProjectGrowth.tsx` - Projects analytics chart
- **RecentActivity:** `/src/components/dashboard/RecentActivity.tsx`

### Layout Components
- **AppSidebar:** `/src/layout/AppSidebar.tsx` - Left navigation
- **AppHeader:** `/src/layout/AppHeader.tsx` - Top header
- **AdminLayoutClient:** `/src/components/layout/AdminLayoutClient.tsx`
- **SidebarWidget:** `/src/layout/SidebarWidget.tsx`
- **Backdrop:** `/src/layout/Backdrop.tsx`

---

## 6. AUTHENTICATION & AUTHORIZATION

### Authentication Flow
1. **Middleware (`middleware.ts`):** Runs on every request, updates Supabase session
2. **AuthContext (`src/context/AuthContext.tsx`):** Client-side auth state management
3. **Sign-in Process:**
   - User submits email/password on `/signin`
   - POST to `/api/auth/signin` 
   - Backend validates with Supabase Auth
   - Checks for `admin` or `administrator` role in user_metadata/app_metadata
   - Returns user data and sets httpOnly auth cookie
4. **Session Management:**
   - Periodic checks every 30 seconds via `/api/auth/session`
   - Maintains auth cookies (supabase-auth-token, auth)
   - Auto-redirect to signin on session expiration

### Authorization

**Admin-Only Access:**
- All protected routes use `requireAdmin()` utility
- Checks for admin/administrator role
- Returns 403 Forbidden if role not present
- Returns 401 Unauthorized if not authenticated

**Route Protection:**
```typescript
// In API routes
await requireAdmin(); // Throws AdminAccessError if not admin

// In components
<AuthGuard>
  {/* Only renders if authenticated and admin */}
</AuthGuard>
```

### User Roles
- **admin/administrator:** Full system access
- **user:** (implicit) Standard user with project/blog access

---

## 7. SAUDI ARABIA & UAE FEATURES

### International Support Found

1. **Billing Country Field**
   - File: `/src/components/user-profile/BillingInformation.tsx`
   - Field: `billing_country` (in accounts table)
   - Supports international billing addresses

2. **Phone Input with Country Codes**
   - File: `/src/components/form/group-input/PhoneInput.tsx`
   - Component: `PhoneInput` with `CountryCode` interface
   - Accepts countries array parameter (extensible)
   - Can support any country codes including +966 (SA), +971 (UAE)

3. **Currency Support**
   - `accounts.currency` field in database
   - Razorpay payments support multi-currency
   - Current evidence: "INR" in metrics

4. **Regional Expansion Potential**
   - Infrastructure ready for multi-country operation
   - Billing information captures country
   - Phone input component designed for international use

### Recommendations for Saudi/UAE Enhancement
- Add country-specific payment gateways (Moyasar, 2Checkout)
- Implement VAT for Saudi Arabia (15%) and UAE (5%)
- Support Arabic language UI
- Add country-specific SMS/email templates
- KSA/UAE project compliance features

---

## 8. KEY FEATURES

### 1. User Management
- View all users with pagination and search
- View individual user details:
  - Basic info (name, email, avatar)
  - Billing information (address, country, tax number)
  - Account status (plan type, credits, spending)
  - Associated projects (first 5)
  - GSC connections
- Create new users
- Update user information
- Delete users

### 2. Project Management
- List all projects with pagination and search
- Create new projects
- View project details
- Track Google Search Console (GSC) connections
- Project status tracking

### 3. Blog Management
- List blogs from MongoDB with pagination and search
- Display blog metadata:
  - Title, author, project association
  - Word count
  - Status (draft/published)
  - Creation date
- Recent blogs endpoint

### 4. Analytics Dashboard
- **Metrics:**
  - Total users
  - Free vs Pro user breakdown
  - Total payments captured
  - Revenue amount
- **Charts:**
  - User growth over time
  - Blog creation growth
  - Project creation growth
  - Monthly sales data
- **Real-time:**
  - Active users widget
  - Recent activity feed

### 5. Billing & Payments
- Multiple billing fields (address, phone, email)
- Plan tracking (free/pro, duration, status)
- Payment history (Razorpay integration)
- Currency support
- Credit tracking

---

## 9. KEY FILES REFERENCE

### Authentication
- `/src/context/AuthContext.tsx` - Auth state & session management (242 lines)
- `/src/lib/auth/requireAdmin.ts` - Admin check middleware (40 lines)
- `/src/lib/supabase/server.ts` - Server-side Supabase client (34 lines)
- `/src/lib/supabase/middleware.ts` - Middleware session update (60 lines)
- `/src/components/auth/SignInForm.tsx` - Login UI
- `/src/components/auth/AuthGuard.tsx` - Route protection wrapper (43 lines)

### Database
- `/src/lib/mongodb.ts` - MongoDB connection (75 lines)
- `/src/app/api/blogs/route.ts` - Blog API (122 lines)

### Users
- `/src/services/userService.ts` - User API client (162 lines)
- `/src/app/api/users/route.ts` - User listing/creation (199 lines)
- `/src/app/api/users/[id]/route.ts` - User detail (80+ lines)

### Dashboard
- `/src/app/(admin)/page.tsx` - Dashboard home
- `/src/components/dashboard/BlogsGrowth.tsx` - Blog analytics (19,168 bytes)
- `/src/components/dashboard/ProjectGrowth.tsx` - Project analytics (19,238 bytes)
- `/src/components/dashboard/ActiveUsers.tsx` - Active users widget (10,906 bytes)

### Configuration
- `/next.config.ts` - Next.js config (37 lines)
- `/tsconfig.json` - TypeScript config (28 lines)
- `/middleware.ts` - Auth middleware (42 lines)
- `package.json` - Dependencies (v2.0.2)

---

## 10. DEVELOPMENT NOTES

### Important Patterns

1. **Admin-Only Endpoints:**
   All API endpoints (except auth) require `await requireAdmin()` call

2. **Pagination:**
   - Default: 10 per page
   - Max: 50 per page
   - Uses offset/limit pattern

3. **Search Implementation:**
   - Text search through multiple fields
   - Case-insensitive matching
   - MongoDB: $regex, Supabase: ilike

4. **Error Handling:**
   - Custom `AdminAccessError` class
   - `handleApiError()` utility for consistent responses
   - 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)

5. **Caching:**
   - User count cache (5-minute TTL)
   - No-store fetch policies for real-time data

6. **Session Management:**
   - 30-second polling interval for session verification
   - httpOnly cookies for security
   - 7-day token expiration

### Missing/Incomplete Features
- Blog creation/update endpoints (POST /api/blogs)
- Blog content retrieval (only metadata)
- Project update endpoint implementation
- User deletion endpoint
- Comprehensive error logging
- Rate limiting

### Performance Optimizations
- Large user fetches use 1000-per-page pagination
- Dashboard metrics cache user count
- Table pagination prevents full-page loads
- Image optimization via next/image

---

## 11. SECURITY CONSIDERATIONS

1. **Protected Routes:**
   - All admin routes require authentication + admin role
   - API middleware validates every request

2. **Session Security:**
   - httpOnly cookies prevent XSS access to tokens
   - Secure flag in production
   - SameSite=lax for CSRF protection

3. **Credentials:**
   - Environment variables for sensitive data
   - MongoDB auth via URI with credentials
   - Supabase service role key for admin operations

4. **Data Access:**
   - Admin-only data fetching
   - User ID parameters validated
   - Search queries escaped for MongoDB

### Security Recommendations
- Add rate limiting on auth endpoints
- Implement API request signing
- Add audit logging for admin actions
- Enforce HTTPS/TLS
- Regular security headers (CSP, X-Frame-Options)

---

## 12. EXTENSION POINTS

The codebase is designed for extension:

1. **New Entities:** Add routes under `/api/[entity]/` following existing patterns
2. **Payment Providers:** Expand beyond Razorpay in payments collection
3. **Analytics:** New metrics easily added to `/api/analytics/` routes
4. **UI Components:** Reusable components in `/src/components/ui/`
5. **International Support:** Country codes ready in phone input
6. **Additional Tables:** Supabase schema supports new tables seamlessly


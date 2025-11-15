# Rayo-Sense V2 Codebase Documentation

This directory contains comprehensive documentation of the Rayo-Sense admin dashboard codebase.

## Documentation Files

### 1. **CODEBASE_ANALYSIS.md** (Primary - 23KB)
Comprehensive analysis covering all aspects of the codebase:
- Project architecture and technology stack
- Complete folder structure and organization
- All routes and pages (admin, public, API)
- Database schema and models
- Component inventory and organization
- Authentication and authorization flow
- Security considerations
- Key features and functionality
- Development patterns and conventions
- Performance optimizations
- Extension points and recommendations

**Start here for:** Complete technical overview and reference

### 2. **CODEBASE_SUMMARY.txt** (Quick Reference - 6.6KB)
Quick reference guide with essential information:
- Project overview and tech stack
- Key directories
- Database schema summary
- API endpoints overview
- Main pages
- Core components list
- International support features
- Security features checklist
- Key files reference
- Development patterns
- Missing/incomplete features
- Environment variables
- Deployment readiness checklist
- Top 10 recommendations

**Start here for:** Quick facts and at-a-glance overview

### 3. **ARCHITECTURE.txt** (Visual Reference - 12KB)
Visual and textual architecture documentation:
- ASCII diagram of system architecture
- Frontend layer (React + Next.js)
- Middleware layer (session management)
- API layer (20 endpoints organized by resource)
- Database layer (Supabase + MongoDB)
- Data flow examples with ASCII diagrams
- Security layers visualization
- Deployment considerations

**Start here for:** Understanding system architecture and data flow

## Quick Navigation

### For Getting Started
1. Read CODEBASE_SUMMARY.txt for quick overview
2. Check ARCHITECTURE.txt for system design
3. Reference CODEBASE_ANALYSIS.md for specific details

### For Implementation
1. Review "PATTERNS & CONVENTIONS" in CODEBASE_SUMMARY.txt
2. Check "KEY FILES REFERENCE" for specific implementations
3. Study relevant API route examples in CODEBASE_ANALYSIS.md

### For Troubleshooting
1. See "SECURITY CONSIDERATIONS" in CODEBASE_ANALYSIS.md
2. Check "MISSING/INCOMPLETE FEATURES" in CODEBASE_SUMMARY.txt
3. Review data flow examples in ARCHITECTURE.txt

### For Deployment
1. Check "ENVIRONMENT VARIABLES NEEDED" in CODEBASE_SUMMARY.txt
2. Review "DEPLOYMENT CONSIDERATIONS" in ARCHITECTURE.txt
3. See "DEPLOYMENT READY" checklist in CODEBASE_SUMMARY.txt

### For Saudi Arabia/UAE Features
1. See "SAUDI ARABIA & UAE FEATURES" section in CODEBASE_ANALYSIS.md
2. Check "INTERNATIONAL SUPPORT" in CODEBASE_SUMMARY.txt
3. Review "Opportunities" for regional enhancement

## Key Facts at a Glance

- **Framework:** Next.js 15.2.3 with React 19
- **Database:** MongoDB (blogs) + Supabase/PostgreSQL
- **Authentication:** Supabase Auth with admin-only access
- **API Endpoints:** 20 total (auth, users, projects, blogs, analytics, payments)
- **UI Components:** 72 custom components
- **Tech Stack:** TypeScript, Tailwind CSS, ApexCharts, FullCalendar
- **Protected Routes:** 5 admin pages requiring authentication
- **Security:** 5-layer protection (middleware, requireAdmin, AuthGuard, access control, cookies)

## Project Structure Overview

```
src/
├── app/
│   ├── (admin)/         # Protected admin routes
│   ├── api/             # 20 API endpoints
│   └── (full-width)     # Auth & error pages
├── components/          # 72 UI components
├── context/             # Auth, Theme, Sidebar state
├── lib/                 # Database, auth utilities
├── layout/              # Header, sidebar components
└── services/            # API client services
```

## API Endpoints Summary

### Authentication (3)
- POST /api/auth/signin
- POST /api/auth/signout
- GET /api/auth/session

### Users (8)
- GET/POST /api/users
- GET/PATCH/DELETE /api/users/[id]
- GET /api/users/[id]/{blogs,projects,invoices,usage}

### Projects (7)
- GET/POST /api/projects
- GET /api/projects/{recent,[id],status}
- PATCH/DELETE /api/projects/[id]

### Blogs (2)
- GET /api/blogs
- GET /api/blogs/recent

### Analytics (5)
- GET /api/analytics/{metrics,active-users,user-growth,blogs-growth,project-growth}

### Payments (1)
- GET /api/payments/recent

## Database Schema Summary

**Supabase (PostgreSQL):**
- auth.users (authentication)
- projects (name, url, user_id)
- accounts (billing, plans, payments)
- user_information (extra user data)
- gsc_accounts (Google Search Console)
- razorpay_payments (payment history)

**MongoDB:**
- blogs (title, content, user_id, project_id)

## Next Steps

1. **For detailed technical reference:** Open `CODEBASE_ANALYSIS.md`
2. **For quick lookup:** Use `CODEBASE_SUMMARY.txt`
3. **For architecture understanding:** Review `ARCHITECTURE.txt`
4. **For implementation:** Check `/src` directory structure
5. **For improvements:** See "RECOMMENDATIONS" in CODEBASE_SUMMARY.txt

---

**Analysis Date:** November 13, 2025  
**Project Version:** 2.0.2  
**Framework Version:** Next.js 15.2.3, React 19  

# EduPilot Enterprise Audit Report

**Date:** 22 July 2026  
**Scope:** Full backend + frontend code audit, functional verification, security review, UX/performance review, and production-readiness assessment.  
**Audit Methodology:** Static code review, API smoke testing, backend test suite execution, frontend production build verification, manual school-admin test plan.

---

## 1. Executive Summary

The EduPilot codebase has a solid foundation but is **not yet enterprise-production-ready** for thousands of paying schools without further investment. This audit pass fixed several critical security, consistency, and permission issues, brought the backend test suite to 100% pass, and added permission-based navigation/route guards so modules can be hidden per tenant/role. However, many modules remain dashboard-only placeholders, tenant isolation is still manually enforced per controller, and test/CI/observability coverage is minimal.

### Verification Status

| Check | Result |
|-------|--------|
| Backend starts and `/api/health` responds | ✅ |
| Frontend production build | ✅ (with bundle-size warning) |
| Backend `npm test` | ✅ 13/13 passing |
| School admin login and token/permissions | ✅ |
| Hostel / Inventory / Library / AI hidden for school admin | ✅ |
| Direct URL access to hidden modules blocked | ✅ |

---

## 2. Critical Fixes Applied During Audit

### 2.1 Security
- **`backend/middleware/auth.js`** — `protect` middleware now rejects accounts where `isActive === false` (previously only checked `isDeleted`).
- **`backend/routes/student.js`** — GET endpoints now require `school_admin`, `teacher`, or `super_admin` role to prevent data leaks.
- **`frontend/src/components/PermissionRoute.jsx`** — new route guard that redirects to `/dashboard` when a user lacks the required permission.
- **`frontend/src/App.jsx`** — every module route wrapped in `<PermissionRoute permission="...">` so direct URLs respect role permissions.

### 2.2 Validation & Configuration
- **`backend/middleware/validator.js`** — `registerSchema` role enum now includes `accountant` and `receptionist`; `loginSchema` `tenantId` accepts empty strings.
- **`backend/middleware/saas.js`** — support phone/email no longer hardcoded; pulled from `SUPPORT_PHONE` / `SUPPORT_EMAIL` env vars with safe fallbacks.
- **`backend/middleware/pagination.js`** — `buildPaginationResponse` now returns `{ success: true, data, pagination }` for a consistent API contract.

### 2.3 Permission-Driven UI
- **`frontend/src/components/SaaSLayout.jsx`** — sidebar navigation filtered by `user.permissions` in addition to roles. Modules without matching permissions (e.g. `HOSTEL_VIEW`, `INVENTORY_VIEW`, `LIBRARY_VIEW`, `AI_TOOLS`) are hidden for school admin.

### 2.4 Test Suite
- **`backend/tests/auth.test.js`** — fixed broken tests: dynamic real school IDs, correct student payload schema, proper connection lifecycle. All 13 tests pass.

---

## 3. High-Priority Findings Still Requiring Work

### 3.1 Security & Tenant Isolation
| Issue | Risk | Recommended Fix |
|-------|------|-----------------|
| `tenantMiddleware` is exported but **not mounted globally** | IDOR / cross-tenant leaks if a controller forgets to filter | Mount `tenantMiddleware` on all protected route groups or add an automatic tenant filter to all Mongoose queries |
| `authorize()` middleware uses hardcoded role strings, not permissions | Inflexible RBAC; new roles require code changes | Migrate route guards to `requirePermission('CODE')` and remove role-based access |
| Rate limiter (`express-rate-limit` MemoryStore) applied to `/api/` | 429 errors during rapid navigation or burst tests; in-memory store is not shared across server instances | Move to Redis-backed store and/or set separate, less restrictive limits for authenticated users |
| No input sanitization beyond Joi | XSS / NoSQL injection surface remains | Add `express-mongo-sanitize`, strict `helmet` CSP, and output encoding |
| File upload middleware lacks MIME/extension/virus validation | Malware upload risk | Validate uploads, limit sizes, scan with ClamAV or cloud scanning service |
| No CSRF protection for session-less JWT? | If cookies are ever used, CSRF risk | Keep JWT in `Authorization` header (current) and document this decision; add CSRF if cookies introduced |
| Backend `library` and `ai` routes may not enforce matching `LIBRARY_VIEW` / `AI_TOOLS` permissions | Direct API access bypasses frontend guards | Add `requirePermission` middleware to backend routes |

### 3.2 Functional / Module Gaps
| Module | Status | Notes |
|--------|--------|-------|
| **Students** | Core CRUD works | Needs full manual CRUD re-test after seeding data |
| **Teachers** | Core CRUD works | Empty data after cleanup |
| **Classes** | Core CRUD works | Works |
| **Fees / Invoices / Receipts** | Functional | Fee structures and invoices load; receipt PDF previously fixed |
| **Admissions** | Functional | Uses `STUDENT_CREATE` permission proxy |
| **Examinations** | Functional | Uses `CLASS_VIEW` / `CLASS_MANAGE` permissions |
| **Attendance** | Not fully tested | UI exists; backend controller looks complete |
| **Timetable** | Not fully tested | UI/backend exist |
| **Library** | Hidden by default | Route guarded; backend permission enforcement may be missing |
| **Transport** | Dashboard-only | No full CRUD pages/APIs |
| **Hostel** | Hidden by default | No full CRUD pages/APIs; backend gated |
| **Inventory** | Hidden by default | Dashboard-only placeholder; backend gated |
| **HRMS** | Dashboard-only | Lists employees/departments/leaves/payroll, but APIs were partly removed/dropped; needs full rebuild |
| **AI Tools** | Hidden by default | `getDashboardInsights` is a hardcoded stub; no real LLM integration |
| **Payments** | Facade | No real payment gateway configured |
| **Calendar** | Broken | `GET /api/calendar` returns 404; frontend calls non-existent endpoint |
| **Communication** | Placeholder | UI exists; SMS/email provider integration missing |
| **Reports** | Placeholder | No real report generation |
| **Parent / Student Portals** | Minimal | Only dashboard + child attendance/fees stubs |
| **Bulk Import** | UI exists | Needs backend validation and audit logging review |

### 3.3 Database & Models
- **Indexes**: Most models have tenant/school indexes, but high-cardinality query fields (e.g. `feeReceipts`, `attendance` by date) may need compound indexes for scale.
- **Tenant isolation**: Manual `tenantId`/`schoolId` filters in controllers; a centralized repository/middleware approach would reduce risk.
- **Soft delete**: `isDeleted` / `isActive` patterns are present but not consistently enforced in all list queries.
- **Audit fields**: `createdBy`/`updatedBy` are on models but not always populated.

### 3.4 Frontend UX / Performance
- **Bundle size**: 952 KB main JS chunk; code-splitting with `React.lazy()` and `manualChunks` is recommended.
- **Error handling**: Many pages silently ignore API errors (`catch (e) { /* ignore */ }`), leading to blank data without user feedback.
- **Loading states**: Skeleton loaders exist on some pages but are inconsistent.
- **Responsive/mobile**: Layout uses Tailwind responsive classes, but many tables overflow on small screens.
- **Search bar in `SaaSLayout`**: Non-functional placeholder.
- **Dark mode**: Implemented via `colorMode` localStorage + Tailwind `dark` class; needs verification across all components.
- **Console errors**: Build passes, but runtime console errors should be checked during manual UI walkthrough.

### 3.5 Performance & Scalability
- No Redis or external cache; every query hits MongoDB.
- No CDN or static asset optimization.
- `pdfkit` generates documents in memory; large schools will hit memory limits.
- No query result caching, no GraphQL/DataLoader-style optimization.

### 3.6 Production Readiness
- **CI/CD**: No GitHub Actions / CI pipeline.
- **Linting**: No ESLint in backend; frontend has Vite build but no lint step.
- **Logging**: Uses `console.error` instead of a structured logging framework.
- **Error handling**: `server.js` `unhandledRejection` handler calls `process.exit(1)`, crashing the server on any async error.
- **Testing**: Only one backend test file exists; frontend has no tests.
- **Docker**: No `Dockerfile` or `docker-compose`.
- **Secrets**: `.env` files are in repo? Need `.env` removed from git and `.env.example` maintained.

---

## 4. Recommended Roadmap

### Phase 1 — Security & Permissions (Highest Priority)
1. Mount `tenantMiddleware` globally or wrap all routes/controllers with automatic tenant filtering.
2. Replace `authorize(role)` with `requirePermission(code)` across all backend routes.
3. Add `requirePermission` to `library`, `ai`, and any other routes currently missing it.
4. Add `express-mongo-sanitize`, `helmet` CSP, and file upload validation.
5. Replace in-memory rate limiter with Redis store; set separate limits per route class.

### Phase 2 — Complete Placeholder Modules
1. **Transport**: vehicles, drivers, routes, allocations (CRUD pages + APIs).
2. **Hostel**: hostels, rooms, allocations, visitors.
3. **Inventory**: categories, items, vendors, stock movements.
4. **HRMS**: rebuild employee/department/leave/payroll CRUD and fix missing APIs.
5. **Calendar**: create `/api/calendar/events` CRUD and wire frontend.
6. **Reports & Communication**: either build real features or hide/remove until ready.
7. **AI**: integrate an LLM provider or remove AI feature.
8. **Payments**: integrate Razorpay/Stripe or remove online payments.

### Phase 3 — Quality & Observability
1. Add ESLint + Prettier (backend and frontend) and run in CI.
2. Add Jest/Playwright test suites for every module.
3. Add structured logging (Winston/Pino) and replace `process.exit(1)` with graceful shutdown.
4. Add Docker + `docker-compose` for local dev and deployment.
5. Add GitHub Actions CI for build, test, lint, and security scan.

### Phase 4 — Performance & Scale
1. Add Redis for sessions, rate limiting, and query caching.
2. Implement code-splitting and lazy loading in frontend.
3. Add compound DB indexes for high-volume collections.
4. Move PDF generation to background queue (Bull/Redis) or streaming response.
5. Add CDN for static assets and school logos.

---

## 5. Files Modified / Created During Audit

- `backend/middleware/auth.js`
- `backend/middleware/validator.js`
- `backend/middleware/saas.js`
- `backend/middleware/pagination.js`
- `backend/routes/student.js`
- `backend/tests/auth.test.js`
- `frontend/src/components/SaaSLayout.jsx`
- `frontend/src/components/PermissionRoute.jsx` (new)
- `frontend/src/App.jsx`
- `MANUAL_TEST_PLAN_SCHOOL_ADMIN.md` (new)
- `MANUAL_TEST_RESULTS_SCHOOL_ADMIN.md` (new)
- `ENTERPRISE_AUDIT_REPORT.md` (this file)

---

## 6. Conclusion

This audit pass significantly improved security, permission enforcement, and consistency. The application is now in a more stable state with passing tests and permission-based module hiding. However, before commercial deployment the team must address tenant isolation at the middleware layer, complete placeholder modules, harden security, and build out test/CI/observability infrastructure.

**Biggest remaining risks:**
1. Manual tenant filtering in controllers (easy to miss).
2. Permission enforcement not yet fully migrated from role strings.
3. Placeholder modules (Transport, Hostel, Inventory, HRMS, Calendar, Reports, AI, Payments).
4. No CI/CD, minimal test coverage, no production hardening.

**Immediate next recommended action:** Complete Phase 1 (global tenant middleware + permission-based route guards) and then seed sample data to run the full school-admin manual test plan end-to-end.

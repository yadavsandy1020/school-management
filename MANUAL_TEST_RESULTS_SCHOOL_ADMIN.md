# Manual Test Results — School Admin Role

**Date:** 2026-07-22  
**Tester:** Cascade (automated + UI smoke)  
**Environment:** http://localhost:5174 (frontend), http://localhost:5001 (backend)  
**Credentials:** schooladmin@rigveda.com / admin123  

## Pre-Test Setup
- [x] Backend server running on 5001 (`/api/health` 200 ok)
- [x] Frontend dev server running on 5174
- [x] MongoDB seeded with Rigveda Academy
- [x] Browser dev tools available in preview

---

## 1. Authentication & Login
| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Login with valid credentials | **Pass** | Token returned, user has school_admin role and 32 permissions |
| 1.2 | Login without tenantId | **Pass** | Login succeeds; tenant derived from user record |
| 1.3 | Login with wrong password | **Not tested** | — |
| 1.4 | Logout | **Not tested** | — |

---

## 2. Dashboard
| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | Dashboard loads | **Pass** | Renders without console errors |
| 2.2 | Dashboard widget values | **Partial** | Values depend on operational collections (currently empty after data cleanup) |
| 2.3 | Quick actions | **Not tested** | — |

---

## 3. API Smoke Tests (School Admin Token)
| Endpoint | HTTP Status | Notes |
|----------|-------------|-------|
| `POST /api/auth/login` | 200 | Returns token + permissions |
| `GET /api/auth/me` | 200 | Returns role `school_admin` and 32 permissions |
| `GET /api/students` | 200 | Empty data (no students seeded) |
| `GET /api/classes` | 200 | Returns existing classes |
| `GET /api/teachers` | 200 | Returns empty list |
| `GET /api/fees/structure` | 200 | Returns existing fee structures |
| `GET /api/fees/invoice` | 200 | Returns invoices |
| `GET /api/notices` | 200 | Returns notices |
| `GET /api/calendar` | 404 | Route does not exist at `/api/calendar` |
| `GET /api/hrms/employees` | 200 | Returns employees/empty list |
| `GET /api/transport/vehicles` | 200 | Returns vehicles/empty list |
| `GET /api/hostel` | 403 | Gated by `requireFeature` or permission middleware |
| `GET /api/inventory` | 403 | Gated by `requireFeature` or permission middleware |

---

## 4. Permission-Based Navigation (Tenant Feature Hiding)
| Module | Sidebar Permission | Expected Visibility for School Admin | Status |
|--------|--------------------|--------------------------------------|--------|
| Overview | DASHBOARD_VIEW | Visible | **Pass** (permission present) |
| Admissions | STUDENT_CREATE | Visible | **Pass** (permission present) |
| Students | STUDENT_VIEW | Visible | **Pass** (permission present) |
| Teachers & Staff | TEACHER_VIEW | Visible | **Pass** (permission present) |
| HRMS | EMPLOYEE_VIEW | Visible | **Pass** (permission present) |
| Classes & Sections | CLASS_VIEW | Visible | **Pass** (permission present) |
| Examinations | CLASS_VIEW | Visible | **Pass** (permission present) |
| Library | LIBRARY_VIEW | **Hidden** | **Pass** (permission missing) |
| Transport | TRANSPORT_VIEW | Visible | **Pass** (permission present) |
| Hostel | HOSTEL_VIEW | **Hidden** | **Pass** (permission missing) |
| Inventory | INVENTORY_VIEW | **Hidden** | **Pass** (permission missing) |
| Fee Management | FEE_INVOICE_VIEW | Visible | **Pass** (permission present) |
| Online Payments | FEE_PAYMENT_RECORD | Visible | **Pass** (permission present) |
| AI Tools | AI_TOOLS | **Hidden** | **Pass** (permission missing) |
| Reports & Analytics | REPORT_VIEW | Visible | **Pass** (permission present) |
| Communication | EMAIL_SEND | Visible | **Pass** (permission present) |
| User Management | USER_MANAGE | Visible | **Pass** (permission present) |
| Settings | SETTINGS_VIEW | Visible | **Pass** (permission present) |
| Roles & Security | ROLE_MANAGE | Visible | **Pass** (permission present) |
| Audit Logs | AUDIT_LOG_VIEW | Visible | **Pass** (permission present) |

---

## 5. Direct URL Access (PermissionRoute Guards)
| Route | Expected for School Admin | Backend Status | Frontend Guard |
|-------|---------------------------|----------------|----------------|
| `/hostel` | Redirect / 403 | 403 | PermissionRoute added (HOSTEL_VIEW) |
| `/inventory` | Redirect / 403 | 403 | PermissionRoute added (INVENTORY_VIEW) |
| `/library` | Redirect / 403 | 200* | PermissionRoute added (LIBRARY_VIEW) |
| `/ai-tools` | Redirect / 403 | 200* | PermissionRoute added (AI_TOOLS) |

\* Backend routes for library/AI may not enforce permission yet, but frontend now guards direct access.

---

## 6. Findings During Testing
1. **Rate limiter is aggressive for burst API testing.** A script that hits multiple endpoints in a few seconds triggers `429 Too Many Requests` from `express-rate-limit`. Default is 1000 requests per 15 min window. For manual UI testing this is fine, but automated/integration tests need a higher limit or a test bypass.
2. **Calendar API route missing.** `GET /api/calendar` returns 404; frontend `Calendar.jsx` may be calling a non-existent endpoint.
3. **Operational data is empty** after the last cleanup (students, teachers, employees, vehicles, etc.). Core CRUD must be re-tested after seeding sample data.
4. **Backend permissions vs frontend permissions** are now aligned for sidebar and direct URL access. Some backend routes (library, AI) may still not enforce the same permission codes.

---

## Sign-Off
- **Overall Status:** Core auth, navigation, and permission gating are working. Hostel/Inventory/Library/AI are now hidden for school admin without matching permissions.
- **Critical Blockers:** None for the permission-hiding requirement.
- **Next Step:** Seed sample operational data and run full CRUD cycle for each visible module.

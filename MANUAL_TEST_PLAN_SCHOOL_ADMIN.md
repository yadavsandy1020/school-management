# Manual Test Plan — School Admin Role

## Test Environment
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5001
- **Credentials:**
  - Email: `schooladmin@rigveda.com`
  - Password: `admin123`
  - Tenant: `1`

## Pre-Test Setup
- [ ] Backend server is running on port 5001 and `/api/health` returns `200 ok`
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] MongoDB contains the Rigveda Academy school with at least one class
- [ ] Browser dev tools are open to capture console errors and network requests

---

## 1. Authentication & Login
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1.1 | Login with valid credentials | Enter schooladmin@rigveda.com / admin123, click Login | Dashboard loads, token stored, user info visible |
| 1.2 | Login without tenantId | Leave tenant input empty/default | Login succeeds without requiring tenantId |
| 1.3 | Login with wrong password | Enter wrong password | Clear error message, no blank screen |
| 1.4 | Logout | Click profile → Logout | Redirected to login, token removed |

---

## 2. Dashboard
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 2.1 | Dashboard loads | After login | Stats cards visible, no console errors |
| 2.2 | Dashboard widget values | Verify numbers | Values match database counts |
| 2.3 | Quick actions | Click each quick action | Opens correct page/route |

---

## 3. Students Module
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 3.1 | Student list | Open Students → List | List loads, pagination works, empty state handled |
| 3.2 | Search student | Type admission number or name | Filtered results shown |
| 3.3 | Add student | Fill form, submit | Student created, admission number generated, success toast |
| 3.4 | View student details | Click a student | Details page opens, all fields populated |
| 3.5 | Edit student | Update class/section, save | Changes persisted, list updated |
| 3.6 | Delete/deactivate student | Click delete/deactivate | Record marked inactive, list refreshed |
| 3.7 | Link parent | Use link-parent action | Parent linked, student updated |

---

## 4. Teachers & Staff
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 4.1 | Teacher list | Open Teachers → List | List loads with pagination |
| 4.2 | Add teacher | Fill form, submit | Teacher created, employee ID generated |
| 4.3 | Assign class/subject | Edit teacher | Class/subject assignments saved |

---

## 5. Classes & Sections
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 5.1 | Class list | Open Classes | List loads |
| 5.2 | Add class | Create new class | Class created, capacity validated |
| 5.3 | Edit class | Update class teacher | Changes saved |

---

## 6. Attendance
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 6.1 | Mark attendance | Select class/section/date, mark present/absent | Attendance saved, counts correct |
| 6.2 | View attendance report | Open attendance reports | Report shows filtered data |

---

## 7. Fees, Invoices & Receipts
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 7.1 | Fee structure list | Open Fees → Structure | Structures load |
| 7.2 | Create fee structure | Add fee for a class | Structure created |
| 7.3 | Create invoice | Generate invoice for a student | Invoice created with correct totals |
| 7.4 | Record payment | Pay invoice | Payment recorded, invoice status updated |
| 7.5 | Print receipt | Open receipt | PDF/print view displays correct amount, school branding, no hardcoded placeholders |

---

## 8. Admissions
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 8.1 | New admission | Fill admission form | Admission created with admission number |
| 8.2 | Convert admission to student | Approve admission | Student record created from admission |

---

## 9. Examinations & Results
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 9.1 | Create exam | Add exam with subjects | Exam created |
| 9.2 | Enter marks | Open marks entry, enter scores | Marks saved, validation works |
| 9.3 | View results | Open results | Results display correctly |

---

## 10. Timetable
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 10.1 | Create timetable | Add periods/subjects/teachers | Timetable saved |
| 10.2 | View timetable | Open timetable view | Grid renders correctly |

---

## 11. Library
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 11.1 | Add book | Fill book form | Book added |
| 11.2 | Issue book | Issue to student | Issue record created |
| 11.3 | Return book | Mark return | Book returned, fine calculated if overdue |

---

## 12. Calendar & Notices
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 12.1 | Add event | Create calendar event | Event appears on calendar |
| 12.2 | Add notice | Create notice | Notice visible on dashboard/list |

---

## 13. HRMS / Transport / Hostel / Inventory (Placeholder Modules)
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 13.1 | HRMS dashboard | Open HRMS | If placeholder, note missing CRUD |
| 13.2 | Transport dashboard | Open Transport | If placeholder, note missing CRUD |
| 13.3 | Hostel dashboard | Open Hostel | If placeholder, note missing CRUD |
| 13.4 | Inventory dashboard | Open Inventory | If placeholder, note missing CRUD |

---

## 14. Settings
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 14.1 | School settings | Update school info, logo, theme | Changes saved |
| 14.2 | Academic sessions | Add/update session | Session list updates |
| 14.3 | Roles & permissions | View roles | Permissions visible, no broken UI |

---

## 15. UX / Cross-Cutting Checks
| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 15.1 | Responsive layout | Resize browser to mobile/tablet | No overflow, sidebar collapses |
| 15.2 | Dark mode | Toggle dark mode | Colors invert correctly |
| 15.3 | Loading states | Throttle network | Skeleton loaders / spinners shown |
| 15.4 | Error handling | Disconnect backend briefly | User-friendly error, no blank screen |
| 15.5 | Console errors | Navigate through modules | No uncaught errors |

---

## Result Tracking Template
| Module | Test Case | Status (Pass/Fail/Partial) | Notes / Bug |
|--------|-----------|---------------------------|-------------|
| Auth | 1.1 | | |
| Dashboard | 2.1 | | |
| Students | 3.1 | | |
| ... | ... | | |

---

## Sign-Off
- **Tester:** _______________
- **Date:** _______________
- **Overall Status:** _______________
- **Critical Blockers:** _______________

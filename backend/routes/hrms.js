const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess, checkStaffLimit } = require('../middleware/saas');
const hrmsController = require('../controllers/hrmsController');

router.use(protect, requireActiveLicense, requireFeature('HR'));

// Departments
router.get('/departments', requirePermission('EMPLOYEE_VIEW'), hrmsController.getDepartments);
router.post('/departments', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.createDepartment);
router.put('/departments/:id', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.updateDepartment);
router.delete('/departments/:id', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.deleteDepartment);

// Employees
router.get('/employees', requirePermission('EMPLOYEE_VIEW'), hrmsController.getEmployees);
router.post('/employees', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), checkStaffLimit(1), requireWriteAccess, hrmsController.createEmployee);
router.put('/employees/:id', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.updateEmployee);
router.delete('/employees/:id', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.deleteEmployee);

// Leaves
router.get('/leaves', requirePermission('EMPLOYEE_VIEW'), hrmsController.getLeaves);
router.post('/leaves', authorize('super_admin', 'school_admin', 'teacher'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.createLeave);
router.put('/leaves/:id/status', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.updateLeaveStatus);
router.delete('/leaves/:id', authorize('super_admin', 'school_admin'), requirePermission('EMPLOYEE_MANAGE'), requireWriteAccess, hrmsController.deleteLeave);

// Payroll
router.get('/payrolls', requirePermission('EMPLOYEE_VIEW'), hrmsController.getPayrolls);
router.post('/payrolls', authorize('super_admin', 'school_admin'), requirePermission('PAYROLL_MANAGE'), requireFeature('PAYROLL'), requireWriteAccess, hrmsController.createPayroll);
router.put('/payrolls/:id', authorize('super_admin', 'school_admin'), requirePermission('PAYROLL_MANAGE'), requireFeature('PAYROLL'), requireWriteAccess, hrmsController.updatePayroll);
router.delete('/payrolls/:id', authorize('super_admin', 'school_admin'), requirePermission('PAYROLL_MANAGE'), requireFeature('PAYROLL'), requireWriteAccess, hrmsController.deletePayroll);

module.exports = router;

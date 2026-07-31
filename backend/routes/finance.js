const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  recordSalary,
  getSalaries,
  getSalary,
  updateSalary,
  deleteSalary,
  recordExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  generateSalarySlip
} = require('../controllers/financeController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('FINANCE'));

// Teacher salary payment routes
router.route('/salaries')
  .post(authorize('school_admin', 'super_admin'), requireFeature('PAYROLL'), requireWriteAccess, recordSalary)
  .get(authorize('school_admin', 'super_admin'), requireFeature('PAYROLL'), getSalaries);

router.route('/salaries/:id')
  .get(authorize('school_admin', 'super_admin'), requireFeature('PAYROLL'), getSalary)
  .put(authorize('school_admin', 'super_admin'), requireFeature('PAYROLL'), requireWriteAccess, updateSalary)
  .delete(authorize('school_admin', 'super_admin'), requireFeature('PAYROLL'), requireWriteAccess, deleteSalary);

router.get('/salaries/:id/slip', authorize('school_admin', 'super_admin'), requireFeature('PAYROLL'), generateSalarySlip);

// School expense routes
router.route('/expenses')
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, recordExpense)
  .get(authorize('school_admin', 'super_admin'), getExpenses);

router.route('/expenses/:id')
  .get(authorize('school_admin', 'super_admin'), getExpense)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateExpense)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteExpense);

module.exports = router;

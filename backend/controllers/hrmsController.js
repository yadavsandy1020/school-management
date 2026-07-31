const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Department = require('../models/Department');
const { getNextNumber } = require('../services/sequenceService');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

// Departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ ...tenantFilter(req), isActive: true }).populate('head', 'name').sort({ name: 1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createDepartment = async (req, res) => {
  try {
    const dept = await Department.create({ ...req.body, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: dept });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: dept });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await Department.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Department deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ ...tenantFilter(req), isActive: true })
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name')
      .sort({ joiningDate: -1 });
    res.status(200).json({ success: true, data: employees });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createEmployee = async (req, res) => {
  try {
    const { employeeId, joiningDate, ...rest } = req.body;
    const finalEmployeeId = employeeId?.trim() || await getNextNumber({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      entityType: 'employee',
      academicSession: new Date(joiningDate || Date.now()).getFullYear().toString()
    });
    const employee = await Employee.create({ ...rest, employeeId: finalEmployeeId, joiningDate, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: employee });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: employee });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await Employee.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Employee deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// Leaves
exports.getLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (status) filter.status = status;
    const leaves = await Leave.find(filter)
      .populate('employeeId', 'employeeId department designation')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leaves });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createLeave = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const days = Math.max(1, Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1);
    const leave = await Leave.create({ ...req.body, days, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: leave });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { status, approvedBy: req.user._id, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: leave });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteLeave = async (req, res) => {
  try {
    await Leave.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Leave deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// Payroll
exports.getPayrolls = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'employeeId department designation userId')
      .sort({ year: -1, month: -1 });
    res.status(200).json({ success: true, data: payrolls });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createPayroll = async (req, res) => {
  try {
    const { basicSalary, allowances, deductions, tax } = req.body;
    const netSalary = (basicSalary || 0) + (allowances || 0) - (deductions || 0) - (tax || 0);
    const payroll = await Payroll.create({ ...req.body, netSalary, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: payroll });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updatePayroll = async (req, res) => {
  try {
    const data = req.body;
    if (data.basicSalary !== undefined || data.allowances !== undefined || data.deductions !== undefined || data.tax !== undefined) {
      const current = await Payroll.findOne({ _id: req.params.id, ...tenantFilter(req) });
      data.netSalary = (data.basicSalary ?? current.basicSalary) + (data.allowances ?? current.allowances) - (data.deductions ?? current.deductions) - (data.tax ?? current.tax);
    }
    data.updatedBy = req.user._id;
    const payroll = await Payroll.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, data, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: payroll });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deletePayroll = async (req, res) => {
  try {
    await Payroll.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Payroll deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

const NumberSequence = require('../models/NumberSequence');
const School = require('../models/School');

const defaultConfigs = {
  student: { prefix: 'STU', numberLength: 5, includeAcademicYear: true },
  teacher: { prefix: 'EMP', numberLength: 5, includeAcademicYear: true },
  employee: { prefix: 'EMP', numberLength: 5, includeAcademicYear: true },
  admission: { prefix: 'ADM', numberLength: 5, includeAcademicYear: true },
  parent: { prefix: 'PAR', numberLength: 5, includeAcademicYear: true },
  book: { prefix: 'BOOK', numberLength: 6, includeAcademicYear: false },
  libraryIssue: { prefix: 'LIB', numberLength: 5, includeAcademicYear: true },
  invoice: { prefix: 'INV', numberLength: 5, includeAcademicYear: true },
  feeReceipt: { prefix: 'REC', numberLength: 5, includeAcademicYear: true },
  expense: { prefix: 'EXP', numberLength: 5, includeAcademicYear: true },
  salarySlip: { prefix: 'SAL', numberLength: 5, includeAcademicYear: true },
  purchaseOrder: { prefix: 'PO', numberLength: 5, includeAcademicYear: true },
  transportRoute: { prefix: 'RT', numberLength: 3, includeAcademicYear: false },
  hostelRoom: { prefix: 'RM', numberLength: 3, includeAcademicYear: false },
  hostelAllocation: { prefix: 'ALC', numberLength: 5, includeAcademicYear: false },
  hostelVisitor: { prefix: 'VIS', numberLength: 5, includeAcademicYear: false },
  payment: { prefix: 'PAY', numberLength: 5, includeAcademicYear: true },
  notice: { prefix: 'NTC', numberLength: 5, includeAcademicYear: true },
  exam: { prefix: 'EXM', numberLength: 5, includeAcademicYear: true },
  class: { prefix: 'CLS', numberLength: 5, includeAcademicYear: true },
  document: { prefix: 'DOC', numberLength: 4, includeAcademicYear: true },
  certificate: { prefix: 'CERT', numberLength: 4, includeAcademicYear: true },
  marksheet: { prefix: 'MRK', numberLength: 4, includeAcademicYear: true },
  idcard: { prefix: 'IDC', numberLength: 4, includeAcademicYear: true }
};

const getResetContext = (config, academicSession, financialYear) => {
  if (config.resetPolicy === 'academicYear') return academicSession || '';
  if (config.resetPolicy === 'financialYear') return financialYear || '';
  if (config.resetPolicy === 'monthly') return new Date().toISOString().slice(0, 7);
  if (config.resetPolicy === 'yearly') return new Date().getFullYear().toString();
  return '';
};

const getYearToken = (date, config, academicSession) => {
  if (config.includeFinancialYear && config.financialYear) return config.financialYear.toString().slice(-2);
  if (config.includeAcademicYear && academicSession) return academicSession.toString().slice(-2);
  if (config.includeAcademicYear) return date.getFullYear().toString().slice(-2);
  return '';
};

const buildNumber = (config, nextNum, yearToken, schoolCode) => {
  const parts = [];
  if (config.includeSchoolCode && schoolCode) parts.push(schoolCode);
  if (config.includeBranchCode && config.branchCode) parts.push(config.branchCode);
  if (config.prefix) parts.push(config.prefix);
  if (yearToken) parts.push(yearToken);
  parts.push(String(nextNum).padStart(config.numberLength, '0'));

  const separator = config.separator || '-';
  return parts.join(separator);
};

const getNextNumber = async ({ tenantId, schoolId, entityType, academicSession, financialYear, branchCode }) => {
  if (!tenantId || !schoolId || !entityType) {
    throw new Error('tenantId, schoolId and entityType are required');
  }

  const school = await School.findById(schoolId);
  const schoolCode = school?.schoolCode || '';

  const autoNumbering = school?.autoNumbering || {};
  const entityConfig = autoNumbering[entityType] || {};
  const defaults = defaultConfigs[entityType] || { prefix: entityType.toUpperCase(), numberLength: 5, includeAcademicYear: true };

  const config = {
    ...defaults,
    ...entityConfig,
    financialYear,
    branchCode,
    schoolCode
  };

  const resetContext = getResetContext(config, academicSession, financialYear);
  const filter = { tenantId, schoolId, entityType, resetContext };

  const startingNumber = config.startingNumber || 1;
  await NumberSequence.findOneAndUpdate(
    filter,
    {
      $setOnInsert: {
        currentNumber: startingNumber - 1,
        prefix: config.prefix || '',
        numberLength: config.numberLength || 5,
        includeAcademicYear: config.includeAcademicYear,
        includeFinancialYear: config.includeFinancialYear,
        includeBranchCode: config.includeBranchCode,
        includeSchoolCode: config.includeSchoolCode,
        separator: config.separator || '-'
      }
    },
    { upsert: true, new: true }
  );

  const sequence = await NumberSequence.findOneAndUpdate(
    filter,
    { $inc: { currentNumber: 1 } },
    { new: true }
  );

  if (!sequence) throw new Error('Failed to allocate sequence number');

  const yearToken = getYearToken(new Date(), config, academicSession);
  return buildNumber(
    { ...config, prefix: sequence.prefix || config.prefix },
    sequence.currentNumber,
    yearToken,
    config.includeSchoolCode ? schoolCode : ''
  );
};

module.exports = {
  getNextNumber,
  defaultConfigs
};

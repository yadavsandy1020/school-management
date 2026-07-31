const FeeInvoice = require('../models/FeeInvoice');
const { getNextNumber } = require('./sequenceService');

/**
 * Shared installment invoice generator.
 * Logic: admission fee goes in full with 1st installment;
 *        remaining fees (tuition etc.) after discount are divided by 3.
 *
 * @param {Object} params
 * @param {Object} student        - Student document (must have feeDiscount, classId, etc.)
 * @param {Object} feeStructure   - FeeStructure document
 * @param {Object} ctx            - { tenantId, schoolId, academicSession }
 * @param {Object} options        - { dueDate, transportAlloc (optional) }
 * @returns {Promise<Array>}      - Array of created FeeInvoice documents
 */
async function generateInstallmentInvoices(student, feeStructure, ctx, options = {}) {
  const { tenantId, schoolId, academicSession } = ctx;
  const { dueDate, transportAlloc } = options;

  // Separate admission fees from other fees
  const admissionFees = feeStructure.fees.filter(f => f.type === 'admission');
  const otherFees = feeStructure.fees.filter(f => f.type !== 'admission' && f.type !== 'transport');

  const admissionTotal = admissionFees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const otherSubtotal = otherFees.reduce((s, f) => s + Number(f.amount || 0), 0);

  // Add transport fee to other fees if student has transport allocation
  let transportAmount = 0;
  if (transportAlloc) {
    transportAmount = Number(transportAlloc.fare || 0);
  }
  const totalOther = otherSubtotal + transportAmount;

  // Apply student discount to non-admission portion
  let discountAmount = 0;
  let discountReason = '';
  if (student.feeDiscount && student.feeDiscount.amount > 0) {
    if (student.feeDiscount.type === 'percentage') {
      discountAmount = Math.round((totalOther * student.feeDiscount.amount) / 100);
    } else {
      discountAmount = Math.min(student.feeDiscount.amount, totalOther);
    }
    discountReason = student.feeDiscount.reason || 'Student discount';
  }
  const otherAfterDiscount = totalOther - discountAmount;

  // Divide other fees into 3 installments (last one gets rounding remainder)
  const baseInstallment = Math.floor(otherAfterDiscount / 3);
  const lastInstallment = otherAfterDiscount - baseInstallment * 2;

  const installmentAmounts = [baseInstallment, baseInstallment, lastInstallment];
  const installmentLabels = ['Installment 1', 'Installment 2', 'Installment 3'];

  // Use due dates from fee structure installments if available, else defaults
  const defaultDueDates = [
    dueDate || new Date(),
    dueDate ? new Date(dueDate.getTime() + 120 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    dueDate ? new Date(dueDate.getTime() + 240 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
  ];

  const invoices = [];

  for (let i = 0; i < 3; i++) {
    const isFirst = i === 0;
    const instOtherAmount = installmentAmounts[i];
    const instAdmissionAmount = isFirst ? admissionTotal : 0;
    const instTotal = instAdmissionAmount + instOtherAmount;

    // Build items: admission items (full, only in 1st) + 1/3 of each other fee
    const instItems = [];

    if (isFirst) {
      admissionFees.forEach(fee => {
        instItems.push({
          type: fee.type,
          name: fee.name,
          amount: Number(fee.amount),
          dueDate: fee.dueDate
        });
      });
    }

    // Proportional split of other fees
    otherFees.forEach(fee => {
      const perInst = Math.round(Number(fee.amount) / 3);
      const lastShare = Number(fee.amount) - perInst * 2;
      instItems.push({
        type: fee.type,
        name: fee.name,
        amount: i < 2 ? perInst : lastShare,
        dueDate: fee.dueDate
      });
    });

    // Transport fee split (1/3 each)
    if (transportAmount > 0) {
      const transportPerInst = Math.round(transportAmount / 3);
      const transportLastShare = transportAmount - transportPerInst * 2;
      instItems.push({
        type: 'transport',
        name: transportAlloc?.routeId ? `Transport (${transportAlloc.routeId.name || ''})` : 'Transport Fee',
        amount: i < 2 ? transportPerInst : transportLastShare,
        dueDate: undefined
      });
    }

    // Proportional discount for this installment
    const instDiscountAmount = i < 2
      ? Math.round(discountAmount / 3)
      : (discountAmount - Math.round(discountAmount / 3) * 2);

    const invoiceNo = await getNextNumber({
      tenantId,
      schoolId,
      entityType: 'invoice',
      academicSession
    });

    // Due date: use installment config if available, else default
    let instDueDate = defaultDueDates[i];
    if (feeStructure.installments && feeStructure.installments[i] && feeStructure.installments[i].dueDate) {
      instDueDate = new Date(feeStructure.installments[i].dueDate);
    }

    const invoice = await FeeInvoice.create({
      invoiceNo,
      tenantId,
      schoolId,
      studentId: student._id,
      classId: student.classId,
      academicSession,
      feeStructureId: feeStructure._id,
      installmentLabel: installmentLabels[i],
      items: instItems,
      subtotal: instItems.reduce((s, item) => s + item.amount, 0),
      discount: { amount: instDiscountAmount, reason: discountReason },
      totalAmount: instTotal,
      balanceAmount: instTotal,
      paidAmount: 0,
      status: 'pending',
      dueDate: instDueDate,
      payments: []
    });

    invoices.push(invoice);
  }

  return invoices;
}

/**
 * Recalculate unpaid installments when transport is opted in after initial invoice generation.
 * Adds transport fee items to each unpaid installment and recalculates totals/balances.
 *
 * @param {Object} student      - Student document
 * @param {Object} transportAlloc - TransportAllocation document (populated with routeId)
 * @param {Object} ctx          - { tenantId, schoolId, academicSession }
 * @returns {Promise<Array>}    - Updated unpaid invoices
 */
async function recalculateInstallmentsForTransport(student, transportAlloc, ctx) {
  const { tenantId, schoolId, academicSession } = ctx;

  // Find all unpaid (pending or partial) installments for this student/session
  const unpaidInvoices = await FeeInvoice.find({
    tenantId,
    schoolId,
    studentId: student._id,
    academicSession,
    status: { $in: ['pending', 'partial', 'overdue'] }
  }).sort({ installmentLabel: 1 });

  if (unpaidInvoices.length === 0) return [];

  const transportAmount = Number(transportAlloc.fare || 0);
  if (transportAmount <= 0) return unpaidInvoices;

  // Split transport fee equally across unpaid installments
  const count = unpaidInvoices.length;
  const baseShare = Math.floor(transportAmount / count);
  const lastShare = transportAmount - baseShare * (count - 1);
  const transportLabel = transportAlloc.routeId
    ? `Transport (${transportAlloc.routeId.name || transportAlloc.routeId.routeNumber || ''})`
    : 'Transport Fee';

  const updated = [];

  for (let i = 0; i < unpaidInvoices.length; i++) {
    const inv = unpaidInvoices[i];
    const shareAmount = i < count - 1 ? baseShare : lastShare;

    // Check if transport item already exists (avoid duplicates)
    const hasTransport = inv.items.some(item => item.type === 'transport');
    if (hasTransport) {
      updated.push(inv);
      continue;
    }

    // Add transport fee item
    inv.items.push({
      type: 'transport',
      name: transportLabel,
      amount: shareAmount,
      dueDate: undefined
    });

    // Recalculate subtotal, total, balance
    inv.subtotal = inv.items.reduce((s, item) => s + item.amount, 0);
    inv.totalAmount = inv.subtotal - (inv.discount?.amount || 0) + (inv.lateFee || 0);
    inv.balanceAmount = inv.totalAmount - inv.paidAmount;

    // Update status if now fully paid (edge case: was partial and transport made it... still partial)
    if (inv.balanceAmount <= 0) {
      inv.status = 'paid';
    }

    await inv.save();
    updated.push(inv);
  }

  return updated;
}

module.exports = { generateInstallmentInvoices, recalculateInstallmentsForTransport };

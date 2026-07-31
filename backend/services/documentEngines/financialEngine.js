const { BaseEngine, clean, formatDate, formatCurrency, numberToWords } = require('./baseEngine');

/**
 * FinancialDocumentEngine — fee receipts, fee invoices, salary slips.
 * Modern minimal design: lots of white space, clean typography, no heavy boxes.
 */
class FinancialDocumentEngine extends BaseEngine {
  /**
   * Generate a fee receipt — clean, spacious, minimal.
   */
  async generateFeeReceipt(school, data, options = {}) {
    const printing = school?.documentSettings?.printing || {};
    const receiptSize = printing.receiptSize || 'A5';
    const pageSize = receiptSize === 'A4' ? 'A4' : receiptSize === 'halfA4' ? 'A4' : 'A5';
    const margin = 30;

    const doc = this.createDoc({ size: pageSize, margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;
    const pageHeight = doc.page.height;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    this.drawTitle(doc, 'Fee Receipt', { margin, fontSize: 12 });

    // Receipt info — compact single line
    doc.y += 1;
    const metaY = doc.y;
    doc.fontSize(7.5).font('Helvetica').fillColor('#9ca3af');
    doc.text(`Receipt No: ${clean(data.receiptNumber)}`, margin, metaY, { width: contentWidth / 2, align: 'left' });
    doc.text(`Date: ${formatDate(data.paymentDate)}`, margin + contentWidth / 2, metaY, { width: contentWidth / 2, align: 'right' });
    doc.y = metaY + 12;

    // Student info — compact 2-column
    const studentItems = [
      { label: 'Student Name', value: clean(data.student) },
      { label: 'Admission No', value: clean(data.admissionNo) },
      { label: 'Class', value: clean(data.className) },
      { label: 'Session', value: clean(data.academicSession) },
    ];
    if (data.invoice?.invoiceNumber) studentItems.push({ label: 'Invoice No', value: clean(data.invoice.invoiceNumber) });
    this.drawInfoBlock(doc, studentItems, { x: margin, columns: 2, rowHeight: 20 });

    // Fee items table — compact
    if (data.invoice?.items && data.invoice.items.length) {
      doc.y += 2;
      const invoice = data.invoice;
      const subtotal = invoice.subtotal ?? invoice.items.reduce((s, i) => s + Number(i.amount || 0), 0);
      const lateFee = Number(invoice.lateFee || 0);
      const discount = Number(invoice.discount?.amount || 0);
      const total = invoice.totalAmount ?? (subtotal + lateFee - discount);
      const paid = Number(invoice.paidAmount || data.amount || 0);
      const balance = invoice.balanceAmount ?? (total - paid);

      const headers = ['Description', 'Amount'];
      const widths = [contentWidth - 65, 65];
      const rows = invoice.items.map(item => [item.name || item.type || 'Fee', formatCurrency(item.amount)]);

      this.drawTable(doc, {
        headers, rows, widths, x: margin, y: doc.y,
        aligns: ['left', 'right'], repeatHeader: false,
        fontSize: 7.5, headerFontSize: 6.5, rowHeight: 12, headerHeight: 14,
      });

      // Totals — right-aligned, compact
      doc.y += 1;
      const totalsX = margin + contentWidth - 145;
      const totalLines = [
        ['Subtotal', formatCurrency(subtotal)],
        ...(lateFee ? [['Late Fee', formatCurrency(lateFee)]] : []),
        ...(discount ? [['Discount', `-${formatCurrency(discount)}`]] : []),
      ];
      totalLines.forEach(([label, val]) => {
        const lineY = doc.y;
        doc.fontSize(7.5).font('Helvetica').fillColor('#9ca3af');
        doc.text(label, totalsX, lineY, { width: 65, align: 'right' });
        doc.font('Helvetica').fillColor('#374151');
        doc.text(val, totalsX + 70, lineY, { width: 75, align: 'right' });
        doc.y = lineY + 11;
      });

      // Amount paid — compact
      doc.y += 2;
      this.drawAmountBox(doc, 'Amount Paid', formatCurrency(paid), { width: 145, margin, height: 24, fontSize: 13 });

      // Balance — simple text
      if (balance > 0) {
        doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
        doc.text(`Balance: ${formatCurrency(balance)}`, margin, doc.y + 1, { width: contentWidth, align: 'right' });
      }

      // Amount in words — compact
      doc.y += 4;
      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#9ca3af');
      doc.text(`In Words: ${numberToWords(paid)}`, margin, doc.y, { width: contentWidth });
    }

    // Payment details — compact, inline
    doc.y += 5;
    const payDetailParts = [
      `Mode: ${clean(data.paymentMode)}`,
      data.transactionId ? `Ref: ${clean(data.transactionId)}` : '',
      data.receivedBy ? `By: ${clean(data.receivedBy)}` : '',
    ].filter(Boolean);
    if (payDetailParts.length) {
      doc.fontSize(7.5).font('Helvetica').fillColor('#6b7280');
      doc.text(payDetailParts.join('   ·   '), margin, doc.y, { width: contentWidth });
    }

    // Signatures & seal at bottom, footer last
    const sigY = pageHeight - margin - 55;
    this.drawSeal(doc, school, { margin, sealY: sigY - 20 });
    this.drawSignatures(doc, school, { margin, signatureY: sigY });
    this.drawFooter(doc, school, { margin, footerHeight: 28 });

    doc.end();
    return bufferPromise;
  }

  /**
   * Generate a fee invoice — clean, professional, minimal.
   */
  async generateFeeInvoice(school, data, options = {}) {
    const margin = 40;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    this.drawTitle(doc, 'Fee Invoice', { margin });

    // Invoice info — clean left/right row with consistent baseline
    doc.y += 2;
    const invMetaY = doc.y;
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text(`Invoice No: ${clean(data.invoice?.invoiceNumber)}`, margin, invMetaY, { width: contentWidth / 2, align: 'left' });
    doc.text(`Date: ${formatDate(data.invoice?.invoiceDate || new Date())}`, margin + contentWidth / 2, invMetaY, { width: contentWidth / 2, align: 'right' });
    doc.y = invMetaY + 14;

    // Due date — subtle, right-aligned
    if (data.invoice?.dueDate) {
      doc.y += 4;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280');
      doc.text(`Due: ${formatDate(data.invoice.dueDate)}`, margin, doc.y, { width: contentWidth, align: 'right' });
    }

    // Installment label
    if (data.invoice?.installmentLabel) {
      doc.y += 3;
      doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
      doc.text(data.invoice.installmentLabel, margin, doc.y, { width: contentWidth });
    }

    doc.y += 12;

    // Student info
    const studentItems = [
      { label: 'Student Name', value: clean(data.student) },
      { label: 'Admission No', value: clean(data.admissionNo) },
      { label: 'Class', value: clean(data.className) },
      { label: 'Academic Session', value: clean(data.academicSession) },
    ];
    if (data.parentName) studentItems.push({ label: 'Parent/Guardian', value: clean(data.parentName) });
    this.drawInfoBlock(doc, studentItems, { x: margin, columns: 2 });

    // Fee breakdown table
    doc.y += 4;
    if (data.invoice?.items && data.invoice.items.length) {
      const inv = data.invoice;
      const subtotal = inv.subtotal ?? inv.items.reduce((s, i) => s + Number(i.amount || 0), 0);
      const lateFee = Number(inv.lateFee || 0);
      const discount = Number(inv.discount?.amount || 0);
      const scholarship = Number(inv.scholarship?.amount || 0);
      const tax = Number(inv.tax || 0);
      const total = inv.totalAmount ?? (subtotal + lateFee - discount - scholarship + tax);

      const headers = ['Fee Type', 'Amount'];
      const colW = [contentWidth * 0.6, contentWidth * 0.4];
      const rows = inv.items.map(item => [
        item.name || item.type || 'Fee',
        formatCurrency(item.amount),
      ]);

      this.drawTable(doc, {
        headers, rows, widths: colW, x: margin, y: doc.y,
        aligns: ['left', 'right'], repeatHeader: true,
        fontSize: 9, rowHeight: 18,
      });

      // Totals — right-aligned, clean
      doc.y += 4;
      const totalRows = [
        ['Subtotal', formatCurrency(subtotal)],
        ...(lateFee ? [['Late Fee', formatCurrency(lateFee)]] : []),
        ...(discount ? [['Discount', `-${formatCurrency(discount)}`]] : []),
        ...(scholarship ? [['Scholarship', `-${formatCurrency(scholarship)}`]] : []),
        ...(tax ? [['Tax', formatCurrency(tax)]] : []),
      ];

      const totalsX = margin + contentWidth - 240;
      totalRows.forEach(([label, val]) => {
        const lineY = doc.y;
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
        doc.text(label, totalsX, lineY, { width: 140, align: 'right' });
        doc.font('Helvetica').fillColor('#1a1a1a');
        doc.text(val, totalsX + 150, lineY, { width: 90, align: 'right' });
        doc.y = lineY + 16;
      });

      // Total payable — prominent
      doc.y += 6;
      this.drawAmountBox(doc, 'Total Payable', formatCurrency(total), { width: 240, margin });

      // Payment status — simple text
      doc.y += 4;
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text(`Status: ${clean(inv.status || 'Unpaid')}`, margin, doc.y, { width: contentWidth / 3 });
      if (inv.paidAmount) doc.text(`Paid: ${formatCurrency(inv.paidAmount)}`, margin + contentWidth / 3, doc.y, { width: contentWidth / 3 });
      if (inv.balanceAmount) doc.text(`Balance: ${formatCurrency(inv.balanceAmount)}`, margin + 2 * contentWidth / 3, doc.y, { width: contentWidth / 3, align: 'right' });
    }

    // Notes & terms — subtle
    if (data.notes || data.terms) {
      doc.y += 12;
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af');
      if (data.notes) doc.text(`Note: ${data.notes}`, margin, doc.y, { width: contentWidth });
      if (data.terms) doc.text(`Terms: ${data.terms}`, margin, doc.y + 2, { width: contentWidth });
    }

    this.drawSeal(doc, school, { margin, sealY: doc.page.height - 130 });
    this.drawSignatures(doc, school, { margin, signatureY: doc.page.height - 90 });
    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }

  /**
   * Generate a salary slip — clean, professional.
   */
  async generateSalarySlip(school, data, options = {}) {
    const margin = 40;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    this.drawTitle(doc, 'Salary Slip', { margin });

    // Employee info
    doc.y += 4;
    const empItems = [
      { label: 'Employee Name', value: clean(data.teacherName || data.employeeName) },
      { label: 'Employee ID', value: clean(data.employeeId) },
      { label: 'Designation', value: clean(data.designation) },
      { label: 'Department', value: clean(data.department) },
      { label: 'Month / Year', value: `${clean(data.month)} / ${clean(data.year)}` },
      { label: 'Pay Date', value: formatDate(data.paymentDate) },
    ];
    if (data.workingDays) empItems.push({ label: 'Working Days', value: clean(data.workingDays) });
    if (data.paidDays) empItems.push({ label: 'Paid Days', value: clean(data.paidDays) });
    this.drawInfoBlock(doc, empItems, { x: margin, columns: 2 });

    // Earnings table
    doc.y += 4;
    const earnings = [];
    if (data.basicSalary) earnings.push(['Basic Salary', formatCurrency(data.basicSalary)]);
    if (data.hra) earnings.push(['HRA', formatCurrency(data.hra)]);
    if (data.da) earnings.push(['DA', formatCurrency(data.da)]);
    if (data.allowances) earnings.push(['Other Allowances', formatCurrency(data.allowances)]);
    if (data.otherEarnings) earnings.push(['Other Earnings', formatCurrency(data.otherEarnings)]);

    const grossSalary = data.grossSalary || (Number(data.basicSalary || 0) + Number(data.hra || 0) + Number(data.da || 0) + Number(data.allowances || 0) + Number(data.otherEarnings || 0));

    if (earnings.length) {
      earnings.push([{ text: 'Gross Salary', bold: true }, { text: formatCurrency(grossSalary), bold: true }]);
      this.drawTable(doc, {
        headers: ['Earnings', 'Amount'],
        rows: earnings,
        widths: [contentWidth / 2 - 5, contentWidth / 2 - 5],
        x: margin, y: doc.y,
        aligns: ['left', 'right'], fontSize: 9, rowHeight: 17,
      });
    }

    // Deductions table
    doc.y += 4;
    const deductions = [];
    if (data.pf) deductions.push(['Provident Fund (PF)', formatCurrency(data.pf)]);
    if (data.esi) deductions.push(['ESI', formatCurrency(data.esi)]);
    if (data.tds) deductions.push(['TDS', formatCurrency(data.tds)]);
    if (data.otherDeductions) deductions.push(['Other Deductions', formatCurrency(data.otherDeductions)]);
    if (data.deductions) deductions.push(['Deductions', formatCurrency(data.deductions)]);

    const totalDeductions = data.totalDeductions || (Number(data.pf || 0) + Number(data.esi || 0) + Number(data.tds || 0) + Number(data.otherDeductions || 0) + Number(data.deductions || 0));
    const netSalary = data.netSalary || data.netPay || (grossSalary - totalDeductions);

    if (deductions.length) {
      deductions.push([{ text: 'Total Deductions', bold: true }, { text: formatCurrency(totalDeductions), bold: true }]);
      this.drawTable(doc, {
        headers: ['Deductions', 'Amount'],
        rows: deductions,
        widths: [contentWidth / 2 - 5, contentWidth / 2 - 5],
        x: margin, y: doc.y,
        aligns: ['left', 'right'], fontSize: 9, rowHeight: 17,
      });
    }

    // Net salary — prominent
    doc.y += 6;
    this.drawAmountBox(doc, 'Net Salary', formatCurrency(netSalary), { width: 240, margin });

    // Amount in words
    doc.y += 4;
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af');
    doc.text(`Amount in Words: ${numberToWords(netSalary)}`, margin, doc.y, { width: contentWidth });

    // Payment method
    if (data.paymentMode) {
      doc.y += 6;
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text(`Payment Method: ${clean(data.paymentMode)}`, margin, doc.y, { width: contentWidth / 2 });
      if (data.transactionId) doc.text(`Reference: ${clean(data.transactionId)}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });
    }

    this.drawSignatures(doc, school, { margin, signatureY: doc.page.height - 90 });
    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }
}

module.exports = FinancialDocumentEngine;

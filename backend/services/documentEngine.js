const PDFDocument = require('pdfkit');
const path = require('path');
const School = require('../models/School');

const clean = (val) => val || '';

const getFullAddress = (address) => {
  const parts = [address?.street, address?.city, address?.district, address?.state, address?.pincode, address?.country].filter(Boolean);
  return parts.join(', ');
};

const getContactLine = (contact) => {
  const parts = [];
  if (contact?.phone) parts.push(`Phone: ${contact.phone}`);
  if (contact?.email) parts.push(`Email: ${contact.email}`);
  if (contact?.website) parts.push(`Website: ${contact.website}`);
  return parts.join(' | ');
};

class DocumentEngine {
  async loadSchool(schoolId) {
    return School.findById(schoolId);
  }

  createDoc(options = {}) {
    return new PDFDocument({ margin: 40, size: 'A4', ...options });
  }

  async drawHeader(doc, school) {
    const ds = school?.documentSettings?.header || {};
    const align = ds.alignment || 'center';

    if (ds.showLogo && school?.logo) {
      try {
        const logoPath = school.logo.startsWith('/') ? path.join(__dirname, '..', school.logo) : school.logo;
        doc.image(logoPath, align === 'center' ? 260 : 40, 40, { width: 60, height: 60 });
      } catch (e) {
        // ignore missing logo
      }
    }

    const y = ds.showLogo ? 110 : 50;
    doc.y = y;
    doc.x = 40;
    doc.fontSize(18).font('Helvetica-Bold');
    if (ds.showName && school?.name) {
      doc.text(school.name, 40, y, { align, width: 520 });
    }
    doc.fontSize(10).font('Helvetica');
    if (ds.showAddress) {
      doc.text(getFullAddress(school?.address), 40, doc.y + 4, { align, width: 520 });
    }
    if (ds.showContact) {
      doc.text(getContactLine(school?.contact), 40, doc.y + 4, { align, width: 520 });
    }

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);
  }

  async drawFooter(doc, school) {
    const ds = school?.documentSettings?.footer || {};
    const align = ds.alignment || 'center';

    const pageHeight = doc.page.height;
    doc.y = pageHeight - 80;
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    const parts = [];
    if (ds.showMotto && school?.motto) parts.push(school.motto);
    if (ds.customText) parts.push(ds.customText);
    if (ds.disclaimer) parts.push(ds.disclaimer);
    if (ds.showPoweredBy) parts.push('Powered by EduPilot');

    if (parts.length) {
      doc.text(parts.join(' | '), 40, doc.y, { align, width: 520 });
    }
  }

  async applyWatermark(doc, school) {
    const wm = school?.documentSettings?.watermark;
    if (!wm?.enabled || !wm.text) return;

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const midX = pageWidth / 2;
    const midY = pageHeight / 2;

    doc.save();
    doc.rotate(-45, { origin: [midX, midY] });
    doc.fontSize(48).fillColor('rgba(200,200,200,0.2)');
    doc.text(wm.text, 0, midY - 20, { align: 'center', width: pageWidth });
    doc.restore();
    doc.fillColor('black');
  }

  async generate(type, data, options = {}) {
    const { schoolId } = data;
    if (!schoolId) throw new Error('schoolId is required');

    const school = await this.loadSchool(schoolId);
    if (!school) throw new Error('School not found');

    const doc = this.createDoc(options);
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    await this.drawHeader(doc, school);
    await this.applyWatermark(doc, school);

    const template = school?.documentTemplates?.[type] || {};
    if (template.header) {
      doc.fontSize(10).font('Helvetica-Oblique').text(template.header, { align: 'center' });
      doc.moveDown(1);
    }

    await this.renderContent(doc, type, data, school);

    if (template.footer || template.notes) {
      doc.moveDown(2);
      if (template.notes) doc.fontSize(9).font('Helvetica-Oblique').text(template.notes, { align: 'left' });
      if (template.footer) doc.fontSize(9).font('Helvetica-Oblique').text(template.footer, { align: 'center' });
    }

    await this.drawFooter(doc, school);
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  async renderContent(doc, type, data, school) {
    const renderers = {
      feeReceipt: this.renderFeeReceipt,
      invoice: this.renderInvoice,
      studentIdCard: this.renderStudentIdCard,
      employeeIdCard: this.renderEmployeeIdCard,
      bonafideCertificate: this.renderBonafideCertificate,
      characterCertificate: this.renderCharacterCertificate,
      transferCertificate: this.renderTransferCertificate,
      reportCard: this.renderReportCard,
      salarySlip: this.renderSalarySlip,
      admitCard: this.renderAdmitCard,
      hallTicket: this.renderAdmitCard,
      notice: this.renderNotice,
      libraryReceipt: this.renderLibraryReceipt,
      transportReceipt: this.renderTransportReceipt,
      hostelReceipt: this.renderHostelReceipt,
      paymentReport: this.renderPaymentReport
    };

    const renderer = renderers[type] || this.renderGeneric;
    await renderer.call(this, doc, data, school, type);
  }

  renderGeneric(doc, data) {
    doc.fontSize(14).font('Helvetica-Bold').text(data.title || 'Document');
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (data.fields && Array.isArray(data.fields)) {
      data.fields.forEach(([label, value]) => {
        doc.text(`${label}: ${value || '-'}`);
      });
    } else if (typeof data.body === 'string') {
      doc.text(data.body);
    } else {
      doc.text(JSON.stringify(data, null, 2));
    }
  }

  renderFeeReceipt(doc, data, school) {
    const { invoice, student, amount, paymentDate, paymentMode, transactionId, receiptNumber, receivedBy, remarks, academicSession, className, admissionNo, payments = [] } = data;

    doc.fontSize(18).font('Helvetica-Bold').text('FEE RECEIPT', { align: 'center' });
    doc.moveDown(0.5);

    if (school?.name) {
      doc.fontSize(9).font('Helvetica-Oblique').text(school.name, { align: 'center' });
      doc.moveDown(0.5);
    }

    const drawRow = (doc, y, cols, widths, align = 'left', bold = false) => {
      let x = 40;
      if (bold) doc.font('Helvetica-Bold');
      else doc.font('Helvetica');
      cols.forEach((col, i) => {
        const w = widths[i] || 100;
        const text = typeof col === 'object' && col !== null ? col.text : String(col || '');
        const isBold = typeof col === 'object' && col !== null && col.bold;
        if (isBold) doc.font('Helvetica-Bold');
        else if (!bold) doc.font('Helvetica');
        doc.text(text, x, y, { width: w, align: align[i] || 'left' });
        x += w;
      });
      return y + 14;
    };

    const drawTable = (doc, title, headers, rows, widths) => {
      doc.fontSize(11).font('Helvetica-Bold').text(title, 40, doc.y);
      doc.moveDown(0.5);
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      y = drawRow(doc, y, headers, widths, headers.map(() => 'left'));
      doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
      doc.font('Helvetica');
      rows.forEach(row => {
        y = drawRow(doc, y, row, widths);
      });
      doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
      doc.y = y + 4;
    };

    // Receipt and student info
    doc.fontSize(10).font('Helvetica');
    const infoRows = [
      ['Receipt No:', receiptNumber || ''],
      ['Date:', paymentDate || new Date().toLocaleDateString()],
      ...(academicSession ? [['Academic Session:', academicSession]] : []),
      ['Student:', student || ''],
      ['Admission No:', admissionNo || ''],
      ['Class:', className || ''],
      ['Invoice No:', invoice?.invoiceNumber || '']
    ];
    const widths = [130, 380];
    let y = doc.y;
    infoRows.forEach(row => { y = drawRow(doc, y, row, widths); });
    doc.y = y + 4;

    // Fee items table with calculation breakdown
    if (invoice?.items && Array.isArray(invoice.items) && invoice.items.length) {
      const itemsTotal = invoice.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const subtotal = invoice?.subtotal ?? itemsTotal;
      const lateFee = Number(invoice?.lateFee || 0);
      const discountAmount = Number(invoice?.discount?.amount || 0);
      const expectedTotal = subtotal + lateFee - discountAmount;

      const feeHeaders = ['Fee Type', 'Amount'];
      const feeRows = invoice.items.map(item => [item.name || item.type || 'Fee', item.amount || 0]);
      feeRows.push([{ text: 'Subtotal', bold: true }, subtotal]);
      if (lateFee) feeRows.push(['Late Fee', lateFee]);
      if (discountAmount) feeRows.push(['Discount', `-${discountAmount}`]);
      feeRows.push([{ text: 'Total', bold: true }, invoice.totalAmount ?? expectedTotal]);
      drawTable(doc, 'Fee Details', feeHeaders, feeRows, [360, 155]);
    }

    // Payments table with dates
    if (payments.length) {
      const payHeaders = ['Date', 'Mode', 'Receipt No', 'Transaction ID', 'Amount'];
      const payRows = payments.map(p => [
        p.date || '',
        p.mode || '',
        p.receiptNo || '',
        p.transactionId || '',
        p.amount || 0
      ]);
      drawTable(doc, 'Payment History', payHeaders, payRows, [70, 75, 80, 110, 70]);
    }

    // Summary
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Total Amount: ${invoice?.totalAmount || 0}`, { align: 'right' });
    doc.text(`Amount Paid: ${invoice?.paidAmount || 0}`, { align: 'right' });
    doc.text(`Balance: ${invoice?.balanceAmount || 0}`, { align: 'right' });
    doc.font('Helvetica');

    if (receivedBy || remarks) {
      doc.moveDown(1);
      if (receivedBy) doc.text(`Received By: ${receivedBy}`);
      if (remarks) doc.text(`Remarks: ${remarks}`);
    }

    doc.moveDown(2);
    if (school?.name) {
      doc.fontSize(9).font('Helvetica-Oblique').text(`This is a computer-generated receipt issued by ${school.name}.`, { align: 'center' });
    }
  }

  renderInvoice(doc, data) {
    const { invoice } = data;
    doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (invoice) {
      doc.text(`Invoice No: ${invoice.invoiceNumber || invoice._id || ''}`);
      doc.text(`Student: ${invoice.studentName || ''}`);
      doc.text(`Class: ${invoice.className || ''}`);
      doc.text(`Due Date: ${invoice.dueDate || ''}`);
      doc.text(`Total: ${invoice.totalAmount || 0}`);
      doc.text(`Paid: ${invoice.paidAmount || 0}`);
      doc.text(`Status: ${invoice.status || ''}`);
      if (invoice.items && Array.isArray(invoice.items)) {
        doc.moveDown(1);
        invoice.items.forEach(item => doc.text(`${item.name}: ${item.amount}`));
      }
    }
  }

  renderStudentIdCard(doc, data) {
    const { student } = data;
    doc.fontSize(14).font('Helvetica-Bold').text('STUDENT ID CARD', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (student) {
      doc.text(`Name: ${student.name}`);
      doc.text(`Admission No: ${student.admissionNo}`);
      doc.text(`Class: ${student.className} ${student.section || ''}`);
      doc.text(`Session: ${student.session || ''}`);
    }
  }

  renderEmployeeIdCard(doc, data) {
    const { employee } = data;
    doc.fontSize(14).font('Helvetica-Bold').text('EMPLOYEE ID CARD', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (employee) {
      doc.text(`Name: ${employee.name}`);
      doc.text(`Employee ID: ${employee.employeeId}`);
      doc.text(`Designation: ${employee.designation || ''}`);
      doc.text(`Department: ${employee.department || ''}`);
    }
  }

  renderBonafideCertificate(doc, data, school) {
    doc.fontSize(16).font('Helvetica-Bold').text('BONAFIDE CERTIFICATE', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    const { student } = data;
    const body = data.templateBody || `This is to certify that ${student?.name || '_____'}, Admission No. ${student?.admissionNo || '_____'}, is a bonafide student of ${school?.name || 'this institution'} studying in class ${student?.className || '_____'} for the academic session ${school?.academicSession || '_____'}.`;
    doc.text(body, { align: 'justify' });
  }

  renderCharacterCertificate(doc, data, school) {
    doc.fontSize(16).font('Helvetica-Bold').text('CHARACTER CERTIFICATE', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    const { student } = data;
    const body = data.templateBody || `This is to certify that ${student?.name || '_____'}, Admission No. ${student?.admissionNo || '_____'}, is a student of ${school?.name || 'this institution'}. His/Her character and conduct have been good during the period of study.`;
    doc.text(body, { align: 'justify' });
  }

  renderTransferCertificate(doc, data, school) {
    doc.fontSize(16).font('Helvetica-Bold').text('TRANSFER CERTIFICATE', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    const { student } = data;
    const body = data.templateBody || `This is to certify that ${student?.name || '_____'}, son/daughter of ${student?.fatherName || '_____'}, is leaving the institution after completing studies in class ${student?.className || '_____'} for the academic session ${school?.academicSession || '_____'}. His/Her conduct and character have been satisfactory.`;
    doc.text(body, { align: 'justify' });
  }

  renderReportCard(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text('REPORT CARD', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (data.student) doc.text(`Student: ${data.student.name}`);
    if (data.exam) doc.text(`Exam: ${data.exam.name}`);
    if (data.marks && Array.isArray(data.marks)) {
      doc.moveDown(1);
      data.marks.forEach(m => doc.text(`${m.subject}: ${m.marksObtained}/${m.maxMarks}`));
    }
  }

  renderSalarySlip(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text('SALARY SLIP', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (data.payroll) {
      doc.text(`Employee: ${data.payroll.employeeName || ''}`);
      doc.text(`Month/Year: ${data.payroll.month}/${data.payroll.year}`);
      doc.text(`Basic: ${data.payroll.basicSalary || 0}`);
      doc.text(`Net Salary: ${data.payroll.netSalary || 0}`);
    }
  }

  renderAdmitCard(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text('ADMIT CARD', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    if (data.student) {
      doc.text(`Name: ${data.student.name}`);
      doc.text(`Roll No: ${data.student.admissionNo}`);
    }
    if (data.exam) doc.text(`Exam: ${data.exam.name}`);
  }

  renderNotice(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text(data.title || 'NOTICE', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica');
    if (data.date) doc.text(`Date: ${data.date}`, { align: 'right' });
    if (data.content) doc.text(data.content, { align: 'justify' });
  }

  renderLibraryReceipt(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text('LIBRARY RECEIPT', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Book: ${data.bookTitle || ''}`);
    doc.text(`Issue ID: ${data.issueNumber || ''}`);
    doc.text(`Issued To: ${data.studentName || ''}`);
    doc.text(`Due Date: ${data.dueDate || ''}`);
  }

  renderTransportReceipt(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text('TRANSPORT RECEIPT', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Route: ${data.routeName || ''}`);
    doc.text(`Student: ${data.studentName || ''}`);
    doc.text(`Amount: ${data.amount || 0}`);
  }

  renderHostelReceipt(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold').text('HOSTEL RECEIPT', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Hostel: ${data.hostelName || ''}`);
    doc.text(`Room: ${data.roomNo || ''}`);
    doc.text(`Student: ${data.studentName || ''}`);
    doc.text(`Amount: ${data.amount || 0}`);
  }

  renderPaymentReport(doc, data, school) {
    const { student, admissionNo, className, section, academicSession, totalBilled, totalPaid, totalOutstanding, invoices = [], allPayments = [] } = data;

    doc.fontSize(18).font('Helvetica-Bold').text('PAYMENT REPORT', { align: 'center' });
    doc.moveDown(0.5);
    if (school?.name) {
      doc.fontSize(9).font('Helvetica-Oblique').text(school.name, { align: 'center' });
      doc.moveDown(0.5);
    }

    const drawRow = (doc, y, cols, widths, align = 'left', bold = false) => {
      let x = 40;
      if (bold) doc.font('Helvetica-Bold');
      else doc.font('Helvetica');
      cols.forEach((col, i) => {
        const w = widths[i] || 100;
        const text = typeof col === 'object' && col !== null ? col.text : String(col || '');
        const isBold = typeof col === 'object' && col !== null && col.bold;
        if (isBold) doc.font('Helvetica-Bold');
        else if (!bold) doc.font('Helvetica');
        doc.text(text, x, y, { width: w, align: (Array.isArray(align) ? align[i] : align) || 'left' });
        x += w;
      });
      return y + 14;
    };

    // Student info
    doc.fontSize(10).font('Helvetica');
    const infoRows = [
      ['Student:', student || '', 'Class:', `${className || ''} ${section ? '- ' + section : ''}`],
      ['Admission No:', admissionNo || '', 'Session:', academicSession || ''],
    ];
    let y = doc.y + 4;
    infoRows.forEach(row => { y = drawRow(doc, y, row, [100, 160, 80, 195]); });
    doc.y = y + 6;

    // Summary box
    doc.fontSize(11).font('Helvetica-Bold').text('Summary', 40, doc.y);
    doc.moveDown(0.5);
    y = doc.y;
    doc.fontSize(10).font('Helvetica');
    y = drawRow(doc, y, ['Total Billed', 'Total Paid', 'Outstanding'], [173, 173, 173], ['left', 'left', 'left'], true);
    doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
    y = drawRow(doc, y, [
      { text: `Rs. ${Number(totalBilled || 0).toLocaleString()}`, bold: true },
      { text: `Rs. ${Number(totalPaid || 0).toLocaleString()}`, bold: true },
      { text: `Rs. ${Number(totalOutstanding || 0).toLocaleString()}`, bold: true }
    ], [173, 173, 173]);
    doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
    doc.y = y + 8;

    // Invoices table
    if (invoices.length) {
      doc.fontSize(11).font('Helvetica-Bold').text('Invoice History', 40, doc.y);
      doc.moveDown(0.5);
      y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      y = drawRow(doc, y, ['Invoice No', 'Quarter', 'Total', 'Paid', 'Balance', 'Status', 'Due Date'], [80, 60, 70, 70, 70, 65, 100]);
      doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
      doc.font('Helvetica');
      invoices.forEach(inv => {
        y = drawRow(doc, y, [
          inv.invoiceNo || '',
          inv.quarter || '-',
          `Rs. ${Number(inv.totalAmount || 0).toLocaleString()}`,
          `Rs. ${Number(inv.paidAmount || 0).toLocaleString()}`,
          `Rs. ${Number(inv.balanceAmount || 0).toLocaleString()}`,
          inv.status || '',
          inv.dueDate || '-'
        ], [80, 60, 70, 70, 70, 65, 100]);
      });
      doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
      doc.y = y + 8;
    }

    // All payments table
    if (allPayments.length) {
      doc.fontSize(11).font('Helvetica-Bold').text('Payment Transactions', 40, doc.y);
      doc.moveDown(0.5);
      y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      y = drawRow(doc, y, ['Date', 'Receipt No', 'Invoice No', 'Mode', 'Transaction ID', 'Amount'], [80, 80, 80, 70, 110, 85]);
      doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
      doc.font('Helvetica');
      allPayments.forEach(p => {
        y = drawRow(doc, y, [
          p.date || '',
          p.receiptNo || '',
          p.invoiceNo || '',
          p.mode || '',
          p.transactionId || '-',
          `Rs. ${Number(p.amount || 0).toLocaleString()}`
        ], [80, 80, 80, 70, 110, 85]);
      });
      doc.moveTo(40, y - 2).lineTo(555, y - 2).stroke();
      doc.y = y + 4;
    }

    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Oblique').text('This is a computer-generated payment report. Please verify with school records.', { align: 'center' });
  }
}

module.exports = new DocumentEngine();

const { BaseEngine, clean, formatDate, resolveImagePath } = require('./baseEngine');

/**
 * CardDocumentEngine — handles student ID, employee ID, and admit cards.
 * CR80 card size: 85.6 x 53.98 mm (~243 x 153 pt).
 * Supports front and back layouts.
 */
class CardDocumentEngine extends BaseEngine {
  /**
   * Generate a student ID card.
   */
  async generateStudentIdCard(school, data, options = {}) {
    const style = this.resolveTemplateStyle(school, 'studentIdCard');
    const layout = school?.documentSettings?.printing?.idCardLayout || 'double';
    const doc = this.createDoc({ size: 'A4', margins: { top: 20, bottom: 20, left: 20, right: 20 } });
    const bufferPromise = this.collectBuffer(doc);

    const student = data.student || {};
    const primaryColor = school?.theme?.primaryColor || '#1e40af';

    // Card dimensions (CR80: 243pt x 153pt)
    const cardW = 243;
    const cardH = 153;
    const gap = 20;
    const pageW = doc.page.width;
    const startX = (pageW - cardW) / 2;
    let startY = 30;

    // Draw front
    this._drawStudentCardFront(doc, school, student, data, style, primaryColor, startX, startY, cardW, cardH);

    if (layout === 'double') {
      // Draw back below front
      startY += cardH + gap;
      this._drawStudentCardBack(doc, school, student, data, style, primaryColor, startX, startY, cardW, cardH);
    }

    doc.end();
    return bufferPromise;
  }

  _drawStudentCardFront(doc, school, student, data, style, primaryColor, x, y, w, h) {
    // Card — white with very light border, no filled header
    doc.rect(x, y, w, h).fillColor('#fff').fill();
    doc.rect(x, y, w, h).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    // School name — top, centered, small bold
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
    const schoolName = school?.shortName || school?.name || '';
    doc.text(schoolName, x + 5, y + 6, { width: w - 10, align: 'center' });
    if (school?.affiliationNumber) {
      doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
      doc.text(`Aff: ${school.affiliationNumber}`, x + 5, y + 18, { width: w - 10, align: 'center' });
    }

    // Thin separator
    doc.moveTo(x + 15, y + 26).lineTo(x + w - 15, y + 26).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    // Photo area — clean, no heavy border
    const photoY = y + 32;
    const photoW = 48;
    const photoH = 52;
    doc.rect(x + 8, photoY, photoW, photoH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    if (student.photo) {
      const imgPath = resolveImagePath(student.photo);
      if (imgPath) {
        try { doc.image(imgPath, x + 9, photoY + 1, { width: photoW - 2, height: photoH - 2 }); } catch (e) { /* ignore */ }
      }
    }

    // Student details — clean, minimal
    const detailX = x + 64;
    const detailW = w - 74;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(clean(student.name || data.studentName), detailX, photoY, { width: detailW });
    doc.fontSize(7).font('Helvetica').fillColor('#6b7280');
    doc.text(`Adm No: ${clean(student.admissionNo || data.admissionNo)}`, detailX, photoY + 14, { width: detailW });
    doc.text(`Class: ${clean(student.className || data.className)} - ${clean(student.section || data.section)}`, detailX, photoY + 24, { width: detailW });
    if (student.rollNo || data.rollNo) doc.text(`Roll: ${clean(student.rollNo || data.rollNo)}`, detailX, photoY + 34, { width: detailW });
    if (data.academicSession || student.session) doc.text(`Session: ${clean(data.academicSession || student.session)}`, detailX, photoY + 44, { width: detailW });

    // QR code (if enabled)
    if (school?.documentSettings?.verification?.qrEnabled && data.verificationUrl) {
      this.drawQRCode(doc, data.verificationUrl, x + w - 50, photoY + 28, 38);
    }

    doc.fillColor('#1a1a1a');
  }

  _drawStudentCardBack(doc, school, student, data, style, primaryColor, x, y, w, h) {
    doc.rect(x, y, w, h).fillColor('#fff').fill();
    doc.rect(x, y, w, h).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    let cy = y + 8;

    // Parent/Guardian
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    doc.text('PARENT / GUARDIAN', x + 5, cy, { width: w - 10 });
    doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
    doc.text(clean(student.fatherName || data.parentName || data.fatherName), x + 5, cy + 9, { width: w - 10 });
    cy += 22;

    // Emergency contact
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    doc.text('EMERGENCY CONTACT', x + 5, cy, { width: w - 10 });
    doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
    doc.text(clean(student.fatherPhone || data.emergencyContact || data.parentPhone), x + 5, cy + 9, { width: w - 10 });
    cy += 22;

    // Blood group
    if (student.bloodGroup || data.bloodGroup) {
      doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
      doc.text('BLOOD GROUP', x + 5, cy, { width: 80 });
      doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
      doc.text(clean(student.bloodGroup || data.bloodGroup), x + 70, cy, { width: 60 });
      cy += 14;
    }

    // Address
    if (data.showAddress || student.address) {
      doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
      doc.text('ADDRESS', x + 5, cy, { width: w - 10 });
      doc.fontSize(7).font('Helvetica').fillColor('#374151');
      const addr = student.address || data.address || '';
      doc.text(clean(addr), x + 5, cy + 9, { width: w - 10 });
      cy += 20;
    }

    // Validity
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    doc.text('VALID FOR', x + 5, cy, { width: 80 });
    doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
    doc.text(clean(data.academicSession || school?.academicSession || ''), x + 60, cy, { width: 100 });

    // School contact at bottom — minimal
    cy = y + h - 32;
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    if (school?.contact?.phone) doc.text(school.contact.phone, x + 5, cy, { width: w - 10 });
    if (school?.contact?.email) doc.text(school.contact.email, x + 5, cy + 8, { width: w - 10 });
    if (school?.address) {
      const addr = [school.address.city, school.address.state].filter(Boolean).join(', ');
      if (addr) doc.text(addr, x + 5, cy + 16, { width: w - 10 });
    }

    // Signature line — thin, minimal
    doc.moveTo(x + w - 65, y + h - 12).lineTo(x + w - 12, y + h - 12).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    doc.fontSize(5).font('Helvetica').fillColor('#9ca3af');
    doc.text('Authorized Sign', x + w - 65, y + h - 10, { width: 53, align: 'center' });

    doc.fillColor('#1a1a1a');
  }

  /**
   * Generate an employee ID card.
   */
  async generateEmployeeIdCard(school, data, options = {}) {
    const style = this.resolveTemplateStyle(school, 'employeeIdCard');
    const layout = school?.documentSettings?.printing?.idCardLayout || 'double';
    const doc = this.createDoc({ size: 'A4', margins: { top: 20, bottom: 20, left: 20, right: 20 } });
    const bufferPromise = this.collectBuffer(doc);

    const employee = data.employee || data;
    const primaryColor = school?.theme?.primaryColor || '#1e40af';
    const cardW = 243, cardH = 153;
    const pageW = doc.page.width;
    const startX = (pageW - cardW) / 2;
    let startY = 30;

    // Front
    this._drawEmployeeCardFront(doc, school, employee, data, style, primaryColor, startX, startY, cardW, cardH);

    if (layout === 'double') {
      startY += cardH + 20;
      this._drawEmployeeCardBack(doc, school, employee, data, style, primaryColor, startX, startY, cardW, cardH);
    }

    doc.end();
    return bufferPromise;
  }

  _drawEmployeeCardFront(doc, school, emp, data, style, primaryColor, x, y, w, h) {
    doc.rect(x, y, w, h).fillColor('#fff').fill();
    doc.rect(x, y, w, h).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(school?.shortName || school?.name || '', x + 5, y + 6, { width: w - 10, align: 'center' });
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    doc.text('EMPLOYEE IDENTITY CARD', x + 5, y + 18, { width: w - 10, align: 'center' });

    doc.moveTo(x + 15, y + 26).lineTo(x + w - 15, y + 26).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    const photoY = y + 32;
    doc.rect(x + 8, photoY, 48, 52).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    if (emp.photo) {
      const imgPath = resolveImagePath(emp.photo);
      if (imgPath) { try { doc.image(imgPath, x + 9, photoY + 1, { width: 46, height: 50 }); } catch (e) { } }
    }

    const dx = x + 64;
    const dw = w - 74;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(clean(emp.name || emp.employeeName), dx, photoY, { width: dw });
    doc.fontSize(7).font('Helvetica').fillColor('#6b7280');
    doc.text(`Emp ID: ${clean(emp.employeeId)}`, dx, photoY + 14, { width: dw });
    doc.text(`Designation: ${clean(emp.designation)}`, dx, photoY + 24, { width: dw });
    doc.text(`Dept: ${clean(emp.department)}`, dx, photoY + 34, { width: dw });
    if (emp.bloodGroup) doc.text(`Blood: ${clean(emp.bloodGroup)}`, dx, photoY + 44, { width: dw });

    if (school?.documentSettings?.verification?.qrEnabled && data.verificationUrl) {
      this.drawQRCode(doc, data.verificationUrl, x + w - 50, photoY + 28, 38);
    }

    doc.fillColor('#1a1a1a');
  }

  _drawEmployeeCardBack(doc, school, emp, data, style, primaryColor, x, y, w, h) {
    doc.rect(x, y, w, h).fillColor('#fff').fill();
    doc.rect(x, y, w, h).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    let cy = y + 8;
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    doc.text('EMERGENCY CONTACT', x + 5, cy, { width: w - 10 });
    doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
    doc.text(clean(emp.emergencyContact || emp.phone), x + 5, cy + 9, { width: w - 10 });
    cy += 22;

    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    doc.text('VALIDITY', x + 5, cy, { width: 80 });
    doc.fontSize(8).font('Helvetica').fillColor('#1a1a1a');
    doc.text(clean(emp.validity || school?.academicSession || ''), x + 55, cy, { width: 100 });
    cy += 16;

    // School contact — minimal
    doc.fontSize(6).font('Helvetica').fillColor('#9ca3af');
    if (school?.contact?.phone) doc.text(school.contact.phone, x + 5, cy, { width: w - 10 });
    if (school?.contact?.email) doc.text(school.contact.email, x + 5, cy + 8, { width: w - 10 });

    // Signature — minimal
    doc.moveTo(x + w - 65, y + h - 12).lineTo(x + w - 12, y + h - 12).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    doc.fontSize(5).font('Helvetica').fillColor('#9ca3af');
    doc.text('Authorized Sign', x + w - 65, y + h - 10, { width: 53, align: 'center' });

    doc.fillColor('#1a1a1a');
  }

  /**
   * Generate an admit card.
   * Supports 1 per A5, 2 per A4, or 4 per A4.
   */
  async generateAdmitCard(school, data, options = {}) {
    const style = this.resolveTemplateStyle(school, 'admitCard');
    const cardsPerPage = options.cardsPerPage || 2;
    const doc = this.createDoc({ size: 'A4', margins: { top: 20, bottom: 20, left: 20, right: 20 } });
    const bufferPromise = this.collectBuffer(doc);

    const students = Array.isArray(data.students) ? data.students : [data.student || data];
    const primaryColor = school?.theme?.primaryColor || '#1e40af';
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 20;

    const cols = cardsPerPage === 4 ? 2 : 1;
    const rows = cardsPerPage === 4 ? 2 : (cardsPerPage === 2 ? 2 : 1);
    const cardW = (pageW - margin * 2 - (cols - 1) * 10) / cols;
    const cardH = (pageH - margin * 2 - (rows - 1) * 10) / rows;

    let idx = 0;
    for (const student of students) {
      if (idx > 0 && idx % cardsPerPage === 0) doc.addPage();

      const posIdx = idx % cardsPerPage;
      const col = posIdx % cols;
      const row = Math.floor(posIdx / cols);
      const x = margin + col * (cardW + 10);
      const y = margin + row * (cardH + 10);

      this._drawAdmitCard(doc, school, student, data, style, primaryColor, x, y, cardW, cardH);
      idx++;
    }

    doc.end();
    return bufferPromise;
  }

  _drawAdmitCard(doc, school, student, examData, style, primaryColor, x, y, w, h) {
    // Clean border, no filled header
    doc.rect(x, y, w, h).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    // Header — school name + ADMIT CARD, centered
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(school?.shortName || school?.name || '', x + 5, y + 5, { width: w - 10, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#9ca3af');
    doc.text('ADMIT CARD', x + 5, y + 16, { width: w - 10, align: 'center' });

    // Thin separator
    doc.moveTo(x + 15, y + 24).lineTo(x + w - 15, y + 24).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    let cy = y + 30;

    // Photo + student info
    const photoSize = 38;
    doc.rect(x + 5, cy, photoSize, photoSize).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    if (student.photo) {
      const imgPath = resolveImagePath(student.photo);
      if (imgPath) { try { doc.image(imgPath, x + 6, cy + 1, { width: photoSize - 2, height: photoSize - 2 }); } catch (e) { } }
    }

    const dx = x + 50;
    const dw = w - 58;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(clean(student.name || student.studentName), dx, cy, { width: dw });
    doc.fontSize(7).font('Helvetica').fillColor('#6b7280');
    doc.text(`Roll No: ${clean(student.rollNo || student.admissionNo)}`, dx, cy + 12, { width: dw });
    doc.text(`Adm No: ${clean(student.admissionNo)}`, dx, cy + 22, { width: dw });
    doc.text(`Class: ${clean(student.className || examData.className)} - ${clean(student.section || examData.section)}`, dx, cy + 32, { width: dw });

    cy += photoSize + 8;

    // Exam name
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(`Examination: ${clean(examData.examName || examData.exam)}`, x + 5, cy, { width: w - 10 });
    cy += 12;

    // Exam schedule — clean, minimal table
    const schedule = examData.schedule || examData.subjects || [];
    if (schedule.length) {
      const colW = [(w - 10) * 0.4, (w - 10) * 0.3, (w - 10) * 0.3];
      // Header
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#9ca3af');
      doc.text('SUBJECT', x + 5, cy, { width: colW[0] });
      doc.text('DATE', x + 5 + colW[0], cy, { width: colW[1], align: 'center' });
      doc.text('TIME', x + 5 + colW[0] + colW[1], cy, { width: colW[2], align: 'center' });
      cy += 8;
      doc.moveTo(x + 5, cy).lineTo(x + w - 5, cy).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      doc.font('Helvetica').fontSize(7).fillColor('#374151');
      schedule.forEach(s => {
        doc.text(clean(s.subject || s.subjectName), x + 5, cy + 3, { width: colW[0] });
        doc.text(formatDate(s.date), x + 5 + colW[0], cy + 3, { width: colW[1], align: 'center' });
        doc.text(clean(s.time), x + 5 + colW[0] + colW[1], cy + 3, { width: colW[2], align: 'center' });
        cy += 10;
      });
    }

    // Reporting time
    if (examData.reportingTime) {
      cy += 4;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(`Reporting Time: ${clean(examData.reportingTime)}`, x + 5, cy, { width: w - 10 });
    }

    // Instructions — subtle
    if (examData.instructions) {
      cy += 10;
      doc.fontSize(6).font('Helvetica-Oblique').fillColor('#9ca3af');
      doc.text('Instructions: ' + examData.instructions, x + 5, cy, { width: w - 10 });
    }

    // Signature — minimal
    cy = y + h - 18;
    doc.moveTo(x + w - 65, cy).lineTo(x + w - 12, cy).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    doc.fontSize(5).font('Helvetica').fillColor('#9ca3af');
    doc.text('Invigilator', x + w - 65, cy + 2, { width: 53, align: 'center' });

    doc.fillColor('#1a1a1a');
  }
}

module.exports = CardDocumentEngine;

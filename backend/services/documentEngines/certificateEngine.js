const { BaseEngine, clean, formatDate, numberToWords } = require('./baseEngine');

/**
 * CertificateDocumentEngine — TC, bonafide, character, study, conduct.
 * Elegant, centered, minimal borders, professional typography.
 */
class CertificateDocumentEngine extends BaseEngine {
  /**
   * Generate a Transfer Certificate — clean formal layout.
   */
  async generateTransferCertificate(school, data, options = {}) {
    const margin = 50;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    doc.y += 16;
    this.drawTitle(doc, 'Transfer Certificate', { margin, fontSize: 16 });

    // TC number and date — subtle
    doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
    doc.text(`TC No: ${clean(data.tcNumber || data.documentNo)}`, margin, doc.y + 4, { width: contentWidth / 2 });
    doc.text(`Date: ${formatDate(data.issueDate || new Date())}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });
    doc.y += 16;

    // TC body — clean numbered fields, no heavy table
    const student = data.student || {};
    const fields = [
      ['1', 'Admission Number', clean(student.admissionNo || data.admissionNo)],
      ['2', 'Student ID', clean(student.studentId)],
      ['3', 'Name of Student', clean(student.name || data.studentName)],
      ['4', "Father's Name", clean(student.fatherName || data.fatherName)],
      ['5', "Mother's Name", clean(student.motherName || data.motherName)],
      ['6', 'Nationality', clean(student.nationality || 'Indian')],
      ['7', 'Date of Birth', formatDate(student.dob || data.dob)],
      ['8', 'Date of Birth (in words)', this._dobInWords(student.dob || data.dob)],
      ['9', 'Date of Admission', formatDate(student.admissionDate || data.admissionDate)],
      ['10', 'Class of Admission', clean(student.admissionClass)],
      ['11', 'Last Class Studied', clean(student.lastClass || data.className)],
      ['12', 'Examination Result', clean(student.examResult || data.examResult)],
      ['13', 'Promotion Status', clean(student.promotionStatus || data.promotionStatus)],
      ['14', 'Subjects Studied', clean(student.subjects || data.subjects)],
      ['15', 'Fee/Dues Status', clean(data.feeStatus || 'Cleared')],
      ['16', 'Last Attendance Date', formatDate(student.lastAttendanceDate || data.lastAttendanceDate)],
      ['17', 'Total Working Days', clean(student.totalWorkingDays || data.totalWorkingDays)],
      ['18', 'Days Present', clean(student.daysPresent || data.daysPresent)],
      ['19', 'General Conduct', clean(student.conduct || data.conduct || 'Satisfactory')],
      ['20', 'Reason for Leaving', clean(student.leavingReason || data.leavingReason)],
      ['21', 'Application Date', formatDate(student.applicationDate || data.applicationDate)],
      ['22', 'Issue Date', formatDate(data.issueDate || new Date)],
    ];

    const visibleFields = fields.filter(([_, __, val]) => val);
    const rowH = 20;
    visibleFields.forEach(([num, label, value]) => {
      if (doc.y + rowH > doc.page.height - 140) {
        doc.addPage();
        doc.y = margin;
      }
      // Number — small, gray
      doc.fontSize(9).font('Helvetica').fillColor('#d1d5db');
      doc.text(num, margin, doc.y, { width: 20 });
      // Label — gray
      doc.font('Helvetica').fillColor('#6b7280');
      doc.text(label, margin + 28, doc.y, { width: 180 });
      // Value — dark
      doc.font('Helvetica').fillColor('#1a1a1a');
      doc.text(value, margin + 220, doc.y, { width: contentWidth - 220 });
      doc.y += rowH;
    });

    // Prepared by / Checked by — subtle
    doc.y += 12;
    doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
    const preparedBy = data.preparedBy || '';
    const checkedBy = data.checkedBy || '';
    if (preparedBy) doc.text(`Prepared By: ${preparedBy}`, margin, doc.y, { width: contentWidth / 2 });
    if (checkedBy) doc.text(`Checked By: ${checkedBy}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });

    // Signatures & seal
    this.drawSeal(doc, school, { margin });
    this.drawSignatures(doc, school, { margin, signatureY: doc.page.height - 90 });

    // QR verification
    if (school?.documentSettings?.verification?.qrEnabled && data.verificationUrl) {
      this.drawQRCode(doc, data.verificationUrl, doc.page.width - margin - 50, doc.page.height - 110, 45);
    }

    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }

  _dobInWords(dob) {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const ordDay = day + (day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th');
    return `${ordDay} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Generate a Bonafide Certificate — elegant, centered, minimal.
   */
  async generateBonafideCertificate(school, data, options = {}) {
    const margin = 50;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    doc.y += 20;
    this.drawTitle(doc, 'Bonafide Certificate', { margin, fontSize: 16 });

    // Certificate number and date — subtle
    doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
    doc.text(`Certificate No: ${clean(data.certificateNumber || data.documentNo)}`, margin, doc.y + 6, { width: contentWidth / 2 });
    doc.text(`Date: ${formatDate(data.issueDate || new Date())}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });
    doc.y += 24;

    // Body text
    const student = data.student || {};
    let body = data.templateBody || `This is to certify that {{studentName}}, S/o / D/o {{parentName}}, Admission No. {{admissionNo}}, is a bonafide student of Class {{class}} - {{section}} of this institution during the academic session {{session}}.`;

    const replacements = {
      '{{studentName}}': clean(student.name || data.studentName),
      '{{parentName}}': clean(student.fatherName || data.parentName),
      '{{admissionNo}}': clean(student.admissionNo || data.admissionNo),
      '{{class}}': clean(student.className || data.className),
      '{{section}}': clean(student.section || data.section),
      '{{session}}': clean(data.academicSession || school?.academicSession || school?.academicConfig?.currentSession),
      '{{schoolName}}': clean(school?.name),
      '{{dob}}': formatDate(student.dob || data.dob),
    };
    for (const [key, val] of Object.entries(replacements)) {
      body = body.split(key).join(val);
    }

    doc.fontSize(11).font('Helvetica').fillColor('#374151');
    doc.text(body, margin, doc.y, { align: 'justify', width: contentWidth, lineGap: 8 });

    // Signatures & seal
    doc.y += 36;
    this.drawSeal(doc, school, { margin });
    this.drawSignatures(doc, school, { margin, signatureY: doc.page.height - 90 });

    // QR verification
    if (school?.documentSettings?.verification?.qrEnabled && data.verificationUrl) {
      this.drawQRCode(doc, data.verificationUrl, doc.page.width - margin - 50, doc.page.height - 110, 45);
    }

    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }

  /**
   * Generate a generic certificate — elegant, centered.
   */
  async generateCertificate(school, data, options = {}) {
    const margin = 50;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    doc.y += 20;
    this.drawTitle(doc, data.title || 'Certificate', { margin, fontSize: 16 });

    // Certificate number and date — subtle
    doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
    doc.text(`Certificate No: ${clean(data.certificateNumber || data.documentNo)}`, margin, doc.y + 6, { width: contentWidth / 2 });
    doc.text(`Date: ${formatDate(data.issueDate || new Date())}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });
    doc.y += 24;

    // Body text
    const student = data.student || {};
    let body = data.templateBody || data.bodyText || '';
    const replacements = {
      '{{studentName}}': clean(student.name || data.studentName),
      '{{fatherName}}': clean(student.fatherName || data.fatherName),
      '{{motherName}}': clean(student.motherName || data.motherName),
      '{{admissionNo}}': clean(student.admissionNo || data.admissionNo),
      '{{class}}': clean(student.className || data.className),
      '{{section}}': clean(student.section || data.section),
      '{{session}}': clean(data.academicSession || school?.academicSession),
      '{{schoolName}}': clean(school?.name),
      '{{dob}}': formatDate(student.dob || data.dob),
      '{{issueDate}}': formatDate(data.issueDate || new Date()),
    };
    for (const [key, val] of Object.entries(replacements)) {
      body = body.split(key).join(val);
    }

    doc.fontSize(11).font('Helvetica').fillColor('#374151');
    doc.text(body, margin, doc.y, { align: 'justify', width: contentWidth, lineGap: 8 });

    // Signatures & seal
    doc.y += 36;
    this.drawSeal(doc, school, { margin });
    this.drawSignatures(doc, school, { margin, signatureY: doc.page.height - 90 });

    // QR verification
    if (school?.documentSettings?.verification?.qrEnabled && data.verificationUrl) {
      this.drawQRCode(doc, data.verificationUrl, doc.page.width - margin - 50, doc.page.height - 110, 45);
    }

    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }
}

module.exports = CertificateDocumentEngine;

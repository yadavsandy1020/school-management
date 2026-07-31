const { BaseEngine, clean, formatDate } = require('./baseEngine');

/**
 * ReportCardEngine — student report cards / progress reports.
 * Clean, minimal, professional. No heavy borders or colored boxes.
 */
class ReportCardEngine extends BaseEngine {
  async generateReportCard(school, data, options = {}) {
    const margin = 40;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Title
    doc.y += 4;
    this.drawTitle(doc, 'Report Card', { margin });

    // Academic session & exam — subtle
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text(`Academic Session: ${clean(data.academicSession || school?.academicSession)}`, margin, doc.y + 2, { width: contentWidth / 2 });
    doc.text(`Examination: ${clean(data.examName)}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });
    doc.y += 12;

    // Student info
    const student = data.student || {};
    const studentItems = [
      { label: 'Student Name', value: clean(student.name || data.studentName) },
      { label: 'Admission No', value: clean(student.admissionNo || data.admissionNo) },
      { label: 'Class', value: clean(student.className || data.className) },
      { label: 'Section', value: clean(student.section || data.section) },
      { label: 'Roll No', value: clean(student.rollNo || data.rollNo) },
      { label: 'DOB', value: formatDate(student.dob || data.dob) },
    ];
    this.drawInfoBlock(doc, studentItems, { x: margin, columns: 2 });

    // Student photo (optional)
    if (data.showPhoto && student.photo) {
      const { resolveImagePath } = require('./baseEngine');
      const imgPath = resolveImagePath(student.photo);
      if (imgPath) {
        try { doc.image(imgPath, doc.page.width - margin - 55, doc.y - 70, { width: 50, height: 50 }); } catch (e) { /* ignore */ }
      }
    }

    // Marks table
    doc.y += 4;
    const subjects = data.subjects || [];
    const cols = data.marksheetColumns || {};
    const showMax = cols.showMaxMarks !== false;
    const showPass = cols.showPassMarks;
    const showTheory = cols.showTheory;
    const showPractical = cols.showPractical;
    const showGrade = cols.showGrade !== false;
    const showPct = cols.showPercentage;
    const showRemarks = cols.showRemarks;

    let headers = ['Subject'];
    let widths = [120];
    if (showMax) { headers.push('Max'); widths.push(50); }
    if (showPass) { headers.push('Pass'); widths.push(50); }
    if (showTheory) { headers.push('Theory'); widths.push(55); }
    if (showPractical) { headers.push('Practical'); widths.push(55); }
    headers.push('Obtained'); widths.push(60);
    if (showGrade) { headers.push('Grade'); widths.push(50); }
    if (showPct) { headers.push('%'); widths.push(45); }
    if (showRemarks) { headers.push('Remarks'); widths.push(90); }

    const rows = subjects.map(subj => {
      let row = [clean(subj.subjectName || subj.subject)];
      if (showMax) row.push(clean(subj.maxMarks));
      if (showPass) row.push(clean(subj.passingMarks));
      if (showTheory) row.push(clean(subj.theoryMarks));
      if (showPractical) row.push(clean(subj.practicalMarks));
      row.push(clean(subj.obtainedMarks ?? subj.total));
      if (showGrade) row.push(clean(subj.grade));
      if (showPct) {
        const pct = subj.maxMarks ? ((subj.obtainedMarks / subj.maxMarks) * 100).toFixed(1) : '';
        row.push(pct);
      }
      if (showRemarks) row.push(subj.result === 'fail' ? 'Needs improvement' : 'Good');
      return row;
    });

    // Total row
    let totalRow = [{ text: 'Total', bold: true }];
    if (showMax) totalRow.push(clean(data.totalMarks));
    if (showPass) totalRow.push('');
    if (showTheory) totalRow.push('');
    if (showPractical) totalRow.push('');
    totalRow.push({ text: clean(data.obtainedTotal), bold: true });
    if (showGrade) totalRow.push('');
    if (showPct) totalRow.push('');
    if (showRemarks) totalRow.push('');
    rows.push(totalRow);

    this.drawTable(doc, {
      headers, rows, widths, x: margin, y: doc.y,
      aligns: headers.map((_, i) => i === 0 ? 'left' : 'center'),
      repeatHeader: true,
      fontSize: 9, headerFontSize: 8, rowHeight: 18,
    });

    // Result summary — clean, no boxes, just large text
    doc.y += 10;
    const summaryW = contentWidth / 3;
    ['Percentage', 'Grade', 'Result'].forEach((label, i) => {
      const val = [data.percentage, data.overallGrade, data.overallResult][i];
      const bx = margin + i * summaryW;
      // Label
      doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
      doc.text(label.toUpperCase(), bx, doc.y, { width: summaryW - 15, align: 'center' });
      // Value — large, bold
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(clean(val) + (label === 'Percentage' ? '%' : ''), bx, doc.y + 12, { width: summaryW - 15, align: 'center' });
    });
    doc.y += 36;

    // Attendance
    if (data.attendance) {
      doc.y += 4;
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
      doc.text(`Attendance: ${clean(data.attendance.daysPresent)} / ${clean(data.attendance.totalDays)} days`, margin, doc.y, { width: contentWidth });
    }

    // Co-scholastic areas
    if (data.coScholastic && data.coScholastic.length) {
      doc.y += 8;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('Co-Scholastic Areas', margin, doc.y, { width: contentWidth });
      doc.y += 4;
      const coRows = data.coScholastic.map(area => [clean(area.area || area.name), clean(area.grade || area.rating)]);
      this.drawTable(doc, {
        headers: ['Area', 'Grade'],
        rows: coRows,
        widths: [contentWidth * 0.6, contentWidth * 0.4],
        x: margin, y: doc.y,
        aligns: ['left', 'center'],
        fontSize: 9, rowHeight: 16,
      });
    }

    // Teacher remarks
    if (data.remarks) {
      doc.y += 8;
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#6b7280');
      doc.text(`Remarks: ${clean(data.remarks)}`, margin, doc.y, { width: contentWidth });
    }

    // Promotion status
    if (data.promotionStatus) {
      doc.y += 4;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(`Promotion: ${clean(data.promotionStatus)}`, margin, doc.y, { width: contentWidth });
    }

    // Signatures — class teacher, principal, parent
    doc.y += 20;
    const sigs = school?.documentSettings?.signatures || {};
    const sigY = doc.page.height - 90;
    const sigItems = [];
    if (sigs.classTeacher?.show !== false) sigItems.push({ label: 'Class Teacher', name: sigs.classTeacher?.name || '' });
    if (sigs.principal?.show !== false) sigItems.push({ label: 'Principal', name: sigs.principal?.name || school?.officials?.principalName || '' });
    sigItems.push({ label: 'Parent/Guardian', name: '' });

    const spacing = contentWidth / sigItems.length;
    sigItems.forEach((sig, i) => {
      const sx = margin + spacing * i + spacing / 2 - 60;
      this._drawSingleSignature(doc, school, sx, sigY, sig.label, sig.name);
    });

    this.drawSeal(doc, school, { margin });
    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }
}

module.exports = ReportCardEngine;

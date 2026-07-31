const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const DocumentTemplate = require('../models/DocumentTemplate');
const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentVerification = require('../models/DocumentVerification');
const Student = require('../models/Student');
const School = require('../models/School');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const FeeInvoice = require('../models/FeeInvoice');
const { getNextNumber } = require('../services/sequenceService');
const DocumentEngineOrchestrator = require('../services/documentEngines');
const { generateVerificationToken } = require('../services/documentEngines/baseEngine');

// ─── Helpers ───

const tenantFilter = (req) => ({
  tenantId: req.user.tenantId,
  schoolId: req.user.schoolId
});

const clean = (val) => (val === undefined || val === null) ? '' : String(val);

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Variable Resolver ───

const resolveVariables = async (student, school, classDoc, options = {}) => {
  const studentName = student ? `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim() : '';
  const addressParts = student?.contactInfo?.address
    ? [student.contactInfo.address.street, student.contactInfo.address.city, student.contactInfo.address.state, student.contactInfo.address.pincode].filter(Boolean)
    : [];

  return {
    // Student variables
    '{{studentName}}': clean(studentName),
    '{{firstName}}': clean(student?.personalInfo?.firstName),
    '{{lastName}}': clean(student?.personalInfo?.lastName),
    '{{fatherName}}': clean(student?.parentInfo?.fatherName),
    '{{motherName}}': clean(student?.parentInfo?.motherName),
    '{{guardianName}}': clean(student?.parentInfo?.guardianName),
    '{{admissionNo}}': clean(student?.admissionNo),
    '{{rollNo}}': clean(student?.rollNo),
    '{{class}}': clean(classDoc?.name),
    '{{section}}': clean(student?.section),
    '{{session}}': clean(student?.academicSession || school?.academicConfig?.currentSession),
    '{{dob}}': formatDate(student?.personalInfo?.dateOfBirth),
    '{{gender}}': clean(student?.personalInfo?.gender),
    '{{bloodGroup}}': clean(student?.personalInfo?.bloodGroup),
    '{{religion}}': clean(student?.personalInfo?.religion),
    '{{caste}}': clean(student?.personalInfo?.caste),
    '{{nationality}}': clean(student?.personalInfo?.nationality),
    '{{motherTongue}}': clean(student?.personalInfo?.motherTongue),
    '{{address}}': addressParts.join(', '),
    '{{phone}}': clean(student?.contactInfo?.phone),
    '{{email}}': clean(student?.contactInfo?.email),
    '{{fatherPhone}}': clean(student?.parentInfo?.fatherPhone),
    '{{motherPhone}}': clean(student?.parentInfo?.motherPhone),
    '{{fatherOccupation}}': clean(student?.parentInfo?.fatherOccupation),
    '{{admissionDate}}': formatDate(student?.admissionDate),
    '{{previousSchool}}': clean(student?.previousSchool),
    '{{leavingDate}}': formatDate(student?.leavingDate),
    '{{leavingReason}}': clean(student?.leavingReason),
    '{{photo}}': clean(student?.photo),

    // School variables
    '{{schoolName}}': clean(school?.name),
    '{{schoolShortName}}': clean(school?.shortName),
    '{{schoolLogo}}': clean(school?.logo),
    '{{schoolAddress}}': school?.address ? [school.address.street, school.address.city, school.address.district, school.address.state, school.address.pincode].filter(Boolean).join(', ') : '',
    '{{schoolPhone}}': clean(school?.contact?.phone),
    '{{schoolEmail}}': clean(school?.contact?.email),
    '{{schoolWebsite}}': clean(school?.contact?.website),
    '{{affiliationNo}}': clean(school?.affiliationNumber),
    '{{schoolCode}}': clean(school?.schoolCode),
    '{{board}}': clean(school?.board),
    '{{motto}}': clean(school?.motto),

    // Signature variables
    '{{principalName}}': clean(school?.officials?.principalName),
    '{{managerName}}': clean(school?.officials?.administratorName),
    '{{classTeacherName}}': clean(options.classTeacherName),

    // Document variables
    '{{certificateNo}}': clean(options.documentNo),
    '{{issueDate}}': formatDate(options.issueDate || new Date()),
    '{{currentDate}}': formatDate(new Date()),

    // Exam variables (for marksheets)
    '{{examName}}': clean(options.examName),
    '{{totalMarks}}': clean(options.totalMarks),
    '{{obtainedTotal}}': clean(options.obtainedTotal),
    '{{percentage}}': clean(options.percentage),
    '{{grade}}': clean(options.overallGrade),
    '{{result}}': clean(options.overallResult),
    '{{rank}}': clean(options.rank),
  };
};

const replaceVariables = (text, variables) => {
  if (!text) return '';
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(key).join(value);
  }
  return result;
};

// ─── PDF Renderers ───

const drawSchoolHeader = (doc, school, styling, options = {}) => {
  const showLogo = styling?.showLogo !== false && school?.logo;
  if (showLogo) {
    try {
      const logoPath = school.logo.startsWith('/') ? path.join(__dirname, '..', school.logo) : school.logo;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 245, 30, { width: 50, height: 50 });
      }
    } catch (e) { /* ignore */ }
  }

  const y = showLogo ? 88 : 35;
  doc.fontSize(styling?.titleFontSize || 18).font('Helvetica-Bold').fillColor(styling?.primaryColor || '#1e40af');
  if (school?.name) {
    doc.text(school.name, 40, y, { align: 'center', width: 515 });
  }
  doc.fontSize(9).font('Helvetica').fillColor('#666');
  const addr = school?.address ? [school.address.street, school.address.city, school.address.state, school.address.pincode].filter(Boolean).join(', ') : '';
  if (addr) doc.text(addr, 40, doc.y + 3, { align: 'center', width: 515 });
  const contact = [school?.contact?.phone && `Ph: ${school.contact.phone}`, school?.contact?.email, school?.contact?.website].filter(Boolean).join(' | ');
  if (contact) doc.text(contact, 40, doc.y + 2, { align: 'center', width: 515 });
  if (school?.affiliationNumber) doc.text(`Affiliation No: ${school.affiliationNumber}`, 40, doc.y + 2, { align: 'center', width: 515 });

  doc.fillColor('#000');
  doc.moveTo(40, doc.y + 8).lineTo(555, doc.y + 8).strokeColor(styling?.primaryColor || '#1e40af').lineWidth(1.5).stroke();
  doc.moveDown(1);
};

const drawSignatures = (doc, template, variables) => {
  const signatures = template?.signatures || [
    { label: 'Principal', variableName: 'principalName', position: 'left' },
    { label: 'Manager', variableName: 'managerName', position: 'right' }
  ];
  const pageHeight = doc.page.height;
  doc.y = pageHeight - 100;

  signatures.forEach(sig => {
    const name = variables[`{{${sig.variableName}}}`] || '';
    const x = sig.position === 'right' ? 380 : sig.position === 'center' ? 210 : 40;
    doc.fontSize(10).font('Helvetica');
    doc.moveTo(x, doc.y).lineTo(x + 130, doc.y).strokeColor('#999').lineWidth(0.5).stroke();
    doc.text(name || '_________________', x, doc.y + 3, { width: 130, align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666');
    doc.text(sig.label, x, doc.y + 2, { width: 130, align: 'center' });
    doc.fillColor('#000');
  });
};

const drawWatermark = (doc, text) => {
  if (!text) return;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  doc.save();
  doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
  doc.fontSize(50).fillColor('rgba(200,200,200,0.15)');
  doc.text(text, 0, pageHeight / 2 - 25, { align: 'center', width: pageWidth });
  doc.restore();
  doc.fillColor('#000');
};

const renderCertificate = (doc, data, school, template, variables) => {
  const styling = template?.styling || {};
  drawSchoolHeader(doc, school, styling);

  if (styling.showWatermark) drawWatermark(doc, styling.watermarkText || school?.name);

  const titleText = replaceVariables(template?.title || data.title || '', variables);
  doc.fontSize(styling.titleFontSize || 20).font('Helvetica-Bold').fillColor(styling.primaryColor || '#1e40af');
  doc.text(titleText, 40, doc.y + 15, { align: 'center', width: 515 });
  doc.fillColor('#000');

  doc.moveDown(2);
  doc.fontSize(styling.bodyFontSize || 11).font('Helvetica');

  // Certificate number and date
  doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666');
  doc.text(`Certificate No: ${variables['{{certificateNo}}']}`, 40, doc.y + 5, { align: 'left', width: 250 });
  doc.text(`Date: ${variables['{{issueDate}}']}`, 305, doc.y, { align: 'right', width: 250 });
  doc.fillColor('#000');
  doc.moveDown(2);

  const bodyText = replaceVariables(template?.bodyText || data.bodyText || '', variables);
  doc.fontSize(styling.bodyFontSize || 11).font('Helvetica');
  doc.text(bodyText, 40, doc.y, { align: 'justify', width: 515, lineGap: 4 });

  if (template?.footerText) {
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666');
    doc.text(replaceVariables(template.footerText, variables), 40, doc.y, { align: 'center', width: 515 });
    doc.fillColor('#000');
  }

  drawSignatures(doc, template, variables);
};

const renderMarksheet = (doc, data, school, template, variables) => {
  const styling = template?.styling || {};
  const cols = template?.marksheetColumns || {};
  drawSchoolHeader(doc, school, styling);

  const titleText = replaceVariables(template?.title || 'REPORT CARD', variables);
  doc.fontSize(styling.titleFontSize || 18).font('Helvetica-Bold').fillColor(styling.primaryColor || '#1e40af');
  doc.text(titleText, 40, doc.y + 10, { align: 'center', width: 515 });
  doc.fillColor('#000');

  // Student info box
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica');
  const studentInfo = [
    [`Student: ${variables['{{studentName}}']}`, `Admission No: ${variables['{{admissionNo}}']}`],
    [`Class: ${variables['{{class}}']} - ${variables['{{section}}']}`, `Roll No: ${variables['{{rollNo}}']}`],
    [`Session: ${variables['{{session}}']}`, `Exam: ${variables['{{examName}}']}`],
    [`Father: ${variables['{{fatherName}}']}`, `DOB: ${variables['{{dob}}']}`],
  ];
  studentInfo.forEach(([left, right]) => {
    doc.text(left, 40, doc.y + 3, { width: 280 });
    doc.text(right, 310, doc.y, { width: 245 });
  });

  doc.moveDown(1);
  // Marks table
  const subjects = data.subjects || [];
  const showTheory = cols.showTheory;
  const showPractical = cols.showPractical;
  const showMax = cols.showMaxMarks !== false;
  const showPass = cols.showPassMarks;
  const showGrade = cols.showGrade !== false;
  const showPct = cols.showPercentage;
  const showRank = cols.showRank;
  const showRemarks = cols.showRemarks;

  // Build column headers
  let headers = ['Subject'];
  let widths = [120];
  if (showMax) { headers.push('Max'); widths.push(50); }
  if (showPass) { headers.push('Pass'); widths.push(50); }
  if (showTheory) { headers.push('Theory'); widths.push(55); }
  if (showPractical) { headers.push('Practical'); widths.push(55); }
  headers.push('Obtained'); widths.push(60);
  if (showGrade) { headers.push('Grade'); widths.push(50); }
  if (showPct) { headers.push('%'); widths.push(45); }
  if (showRank) { headers.push('Rank'); widths.push(45); }
  if (showRemarks) { headers.push('Remarks'); widths.push(90); }

  const tableWidth = widths.reduce((a, b) => a + b, 0);
  const startX = (595 - tableWidth) / 2;

  // Draw header row
  let y = doc.y + 5;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
  doc.rect(startX, y - 2, tableWidth, 18).fillColor(styling.primaryColor || '#1e40af').fill();
  doc.fillColor('#fff');
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 1, { width: widths[i], align: 'center' });
    x += widths[i];
  });
  doc.fillColor('#000');

  // Draw subject rows
  y += 18;
  doc.font('Helvetica').fontSize(9);
  subjects.forEach((subj, idx) => {
    if (idx % 2 === 0) {
      doc.rect(startX, y - 1, tableWidth, 16).fillColor('#f8fafc').fill();
      doc.fillColor('#000');
    }
    x = startX;
    doc.text(subj.subjectName || '', x + 2, y + 1, { width: widths[0] });
    x += widths[0];
    if (showMax) { doc.text(String(subj.maxMarks || ''), x + 2, y + 1, { width: widths[1], align: 'center' }); x += widths[1]; }
    if (showPass) { doc.text(String(subj.passingMarks || ''), x + 2, y + 1, { width: widths[2], align: 'center' }); x += widths[2]; }
    if (showTheory) { doc.text(String(subj.theoryMarks ?? ''), x + 2, y + 1, { width: widths[3], align: 'center' }); x += widths[3]; }
    if (showPractical) { doc.text(String(subj.practicalMarks ?? ''), x + 2, y + 1, { width: widths[4], align: 'center' }); x += widths[4]; }
    const obtIdx = (showMax ? 1 : 0) + (showPass ? 1 : 0) + (showTheory ? 1 : 0) + (showPractical ? 1 : 0) + 1;
    doc.text(String(subj.obtainedMarks ?? subj.total ?? ''), x + 2, y + 1, { width: widths[obtIdx], align: 'center' }); x += widths[obtIdx];
    if (showGrade) { doc.text(subj.grade || '', x + 2, y + 1, { width: widths[obtIdx + 1], align: 'center' }); x += widths[obtIdx + 1]; }
    if (showPct) { const pct = subj.maxMarks ? ((subj.obtainedMarks / subj.maxMarks) * 100).toFixed(1) : ''; doc.text(pct, x + 2, y + 1, { width: widths[obtIdx + 2], align: 'center' }); x += widths[obtIdx + 2]; }
    if (showRank) { doc.text('', x + 2, y + 1, { width: widths[obtIdx + 3], align: 'center' }); x += widths[obtIdx + 3]; }
    if (showRemarks) { doc.text(subj.result === 'fail' ? 'Needs improvement' : 'Good', x + 2, y + 1, { width: widths[obtIdx + 4] }); x += widths[obtIdx + 4]; }
    y += 16;
  });

  // Summary row
  doc.font('Helvetica-Bold').fontSize(9);
  doc.rect(startX, y - 1, tableWidth, 18).fillColor('#f1f5f9').fill();
  doc.fillColor('#000');
  x = startX;
  doc.text('Total', x + 2, y + 2, { width: widths[0] });
  x += widths[0];
  let colIdx = 1;
  if (showMax) { doc.text(String(data.totalMarks || ''), x + 2, y + 2, { width: widths[colIdx], align: 'center' }); x += widths[colIdx]; colIdx++; }
  if (showPass) { x += widths[colIdx]; colIdx++; }
  if (showTheory) { x += widths[colIdx]; colIdx++; }
  if (showPractical) { x += widths[colIdx]; colIdx++; }
  doc.text(String(data.obtainedTotal || ''), x + 2, y + 2, { width: widths[colIdx], align: 'center' });

  // Result summary
  y += 25;
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text(`Percentage: ${data.percentage || 0}%`, 40, y, { width: 200 });
  doc.text(`Grade: ${data.overallGrade || ''}`, 240, y, { width: 150 });
  doc.text(`Result: ${data.overallResult || ''}`, 390, y, { width: 150 });

  if (data.remarks) {
    y += 20;
    doc.fontSize(10).font('Helvetica-Oblique');
    doc.text(`Remarks: ${data.remarks}`, 40, y, { width: 515 });
  }

  drawSignatures(doc, template, variables);
};

const renderIdCard = (doc, data, school, template, variables) => {
  const styling = template?.styling || {};
  const fields = template?.idCardFields || {};
  const student = data.student;

  // ID Card dimensions (CR80: 85.6mm x 54mm ~ 243pt x 153pt)
  const cardW = 243;
  const cardH = 153;
  const pageW = doc.page.width;
  const startX = (pageW - cardW) / 2;
  const startY = 60;

  // ─── Front side ───
  // Background
  doc.rect(startX, startY, cardW, cardH).fillColor('#fff').fill();
  doc.rect(startX, startY, cardW, cardH).strokeColor(styling.primaryColor || '#1e40af').lineWidth(2).stroke();

  // Header bar
  doc.rect(startX, startY, cardW, 28).fillColor(styling.primaryColor || '#1e40af').fill();
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff');
  if (school?.name) doc.text(school.name, startX + 5, startY + 4, { width: cardW - 10, align: 'center' });
  doc.fontSize(7).font('Helvetica');
  if (school?.affiliationNumber) doc.text(`Aff: ${school.affiliationNumber}`, startX + 5, startY + 18, { width: cardW - 10, align: 'center' });

  // Photo
  const photoY = startY + 35;
  doc.rect(startX + 8, photoY, 50, 55).strokeColor('#ccc').lineWidth(0.5).stroke();
  if (student?.photo) {
    try {
      const photoPath = student.photo.startsWith('/') ? path.join(__dirname, '..', student.photo) : student.photo;
      if (fs.existsSync(photoPath)) {
        doc.image(photoPath, startX + 9, photoY + 1, { width: 48, height: 53 });
      }
    } catch (e) { /* ignore */ }
  }

  // Student details on front
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
  doc.text(variables['{{studentName}}'] || '', startX + 65, photoY, { width: cardW - 75 });
  doc.fontSize(7).font('Helvetica').fillColor('#333');
  doc.text(`Adm No: ${variables['{{admissionNo}}']}`, startX + 65, photoY + 12, { width: cardW - 75 });
  doc.text(`Class: ${variables['{{class}}']} - ${variables['{{section}}']}`, startX + 65, photoY + 22, { width: cardW - 75 });
  if (student?.rollNo) doc.text(`Roll: ${variables['{{rollNo}}']}`, startX + 65, photoY + 32, { width: cardW - 75 });
  if (fields.front?.showSession) doc.text(`Session: ${variables['{{session}}']}`, startX + 65, photoY + 42, { width: cardW - 75 });
  if (fields.front?.showDOB) doc.text(`DOB: ${variables['{{dob}}']}`, startX + 65, photoY + 52, { width: cardW - 75 });
  if (fields.front?.showBloodGroup) doc.text(`Blood: ${variables['{{bloodGroup}}']}`, startX + 65, photoY + 62, { width: cardW - 75 });
  if (fields.front?.showParentPhone) doc.text(`Ph: ${variables['{{fatherPhone}}']}`, startX + 8, photoY + 62, { width: 55 });

  // ─── Back side ───
  const backY = startY + cardH + 20;
  doc.rect(startX, backY, cardW, cardH).fillColor('#fff').fill();
  doc.rect(startX, backY, cardW, cardH).strokeColor(styling.primaryColor || '#1e40af').lineWidth(2).stroke();

  if (fields.back?.showSchoolAddress) {
    doc.fontSize(7).font('Helvetica-Bold').fillColor(styling.primaryColor || '#1e40af');
    doc.text('School Address', startX + 5, backY + 5, { width: cardW - 10 });
    doc.fontSize(6).font('Helvetica').fillColor('#333');
    const addr = variables['{{schoolAddress}}'];
    doc.text(addr, startX + 5, backY + 14, { width: cardW - 10 });
  }

  if (fields.back?.showContact) {
    doc.fontSize(6).font('Helvetica').fillColor('#333');
    doc.text(`Phone: ${variables['{{schoolPhone}}']}`, startX + 5, backY + 40, { width: cardW - 10 });
    doc.text(`Email: ${variables['{{schoolEmail}}']}`, startX + 5, backY + 48, { width: cardW - 10 });
    if (variables['{{schoolWebsite}}']) doc.text(`Web: ${variables['{{schoolWebsite}}']}`, startX + 5, backY + 56, { width: cardW - 10 });
  }

  if (fields.back?.showInstructions) {
    doc.fontSize(6).font('Helvetica-Oblique').fillColor('#666');
    doc.text(fields.back?.instructions || '', startX + 5, backY + 70, { width: cardW - 10 });
  }

  if (fields.back?.showSignature) {
    doc.fontSize(7).font('Helvetica').fillColor('#000');
    doc.moveTo(startX + cardW - 70, backY + cardH - 20).lineTo(startX + cardW - 15, backY + cardH - 20).strokeColor('#999').lineWidth(0.5).stroke();
    doc.text('Authorized Sign', startX + cardW - 70, backY + cardH - 18, { width: 55, align: 'center' });
  }
};

const renderFeeDocument = (doc, data, school, template, variables) => {
  const styling = template?.styling || {};
  drawSchoolHeader(doc, school, styling);

  const subType = data.subType || template?.subType || 'feeReceipt';
  const titleMap = {
    feeReceipt: 'FEE RECEIPT',
    feeStatement: 'FEE STATEMENT',
    feeDueNotice: 'FEE DUE NOTICE',
    noDues: 'NO-DUES CERTIFICATE'
  };
  const title = replaceVariables(template?.title || titleMap[subType] || 'FEE DOCUMENT', variables);
  doc.fontSize(styling.titleFontSize || 18).font('Helvetica-Bold').fillColor(styling.primaryColor || '#1e40af');
  doc.text(title, 40, doc.y + 10, { align: 'center', width: 515 });
  doc.fillColor('#000');

  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Receipt No: ${variables['{{certificateNo}}']}`, 40, doc.y + 3, { width: 250 });
  doc.text(`Date: ${variables['{{issueDate}}']}`, 305, doc.y, { width: 250, align: 'right' });

  doc.moveDown(1);
  doc.text(`Student: ${variables['{{studentName}}']}`, 40, doc.y + 3, { width: 280 });
  doc.text(`Admission No: ${variables['{{admissionNo}}']}`, 310, doc.y, { width: 245 });
  doc.text(`Class: ${variables['{{class}}']} - ${variables['{{section}}']}`, 40, doc.y + 3, { width: 280 });
  doc.text(`Session: ${variables['{{session}}']}`, 310, doc.y, { width: 245 });

  const invoice = data.invoice;
  if (invoice) {
    doc.moveDown(1);
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Fee Details', 40, doc.y + 5);
    doc.font('Helvetica');

    // Table
    let y = doc.y + 5;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(40, y - 2, 515, 16).fillColor(styling.primaryColor || '#1e40af').fill();
    doc.fillColor('#fff');
    doc.text('Description', 45, y, { width: 250 });
    doc.text('Amount', 350, y, { width: 100, align: 'right' });
    doc.text('Status', 450, y, { width: 100, align: 'center' });
    doc.fillColor('#000');
    y += 16;
    doc.font('Helvetica').fontSize(9);

    if (invoice.items && invoice.items.length) {
      invoice.items.forEach(item => {
        doc.text(item.name || item.type || '', 45, y, { width: 250 });
        doc.text(`Rs. ${Number(item.amount || 0).toLocaleString()}`, 350, y, { width: 100, align: 'right' });
        doc.text('', 450, y, { width: 100, align: 'center' });
        y += 14;
      });
    }

    doc.moveTo(40, y).lineTo(555, y).strokeColor('#ccc').lineWidth(0.5).stroke();
    y += 5;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Total:', 350, y, { width: 100, align: 'right' });
    doc.text(`Rs. ${Number(invoice.totalAmount || 0).toLocaleString()}`, 450, y, { width: 100, align: 'right' });
    y += 14;
    doc.text('Paid:', 350, y, { width: 100, align: 'right' });
    doc.text(`Rs. ${Number(invoice.paidAmount || 0).toLocaleString()}`, 450, y, { width: 100, align: 'right' });
    y += 14;
    doc.text('Balance:', 350, y, { width: 100, align: 'right' });
    doc.text(`Rs. ${Number(invoice.balanceAmount || 0).toLocaleString()}`, 450, y, { width: 100, align: 'right' });
    y += 14;
    doc.font('Helvetica').fontSize(9);
    doc.text(`Status: ${invoice.status || ''}`, 45, y, { width: 200 });
  }

  if (subType === 'noDues') {
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    const body = replaceVariables(template?.bodyText || `This is to certify that ${variables['{{studentName}}']} has cleared all fee dues towards ${variables['{{schoolName}}']} as on ${variables['{{issueDate}}']}.`, variables);
    doc.text(body, 40, doc.y, { align: 'justify', width: 515 });
  }

  drawSignatures(doc, template, variables);
};

// ─── Generate PDF ───

const generatePdf = async (documentType, data, school, template, variables) => {
  // Try new engine orchestrator first for new document types
  const newEngineTypes = ['report', 'letter', 'salarySlip', 'admitCard', 'notice', 'circular'];
  if (newEngineTypes.includes(documentType) || (data.useNewEngine)) {
    const orchestrator = new DocumentEngineOrchestrator();
    return orchestrator.generate(documentType, { ...data, schoolId: school._id });
  }

  const layout = template?.layout || {};
  const orientation = layout.orientation || 'portrait';
  const doc = new PDFDocument({
    margin: layout.marginTop || 40,
    size: 'A4',
    layout: orientation === 'landscape' ? 'landscape' : 'portrait'
  });

  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  if (documentType === 'certificate') {
    renderCertificate(doc, data, school, template, variables);
  } else if (documentType === 'marksheet') {
    renderMarksheet(doc, data, school, template, variables);
  } else if (documentType === 'idcard') {
    renderIdCard(doc, data, school, template, variables);
  } else if (documentType === 'feeDocument') {
    renderFeeDocument(doc, data, school, template, variables);
  } else {
    // Fallback to new engine
    const orchestrator = new DocumentEngineOrchestrator();
    return orchestrator.generate(documentType, { ...data, schoolId: school._id });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

// ─── Template CRUD ───

exports.getTemplates = async (req, res) => {
  try {
    const { documentType, subType } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (documentType) filter.documentType = documentType;
    if (subType) filter.subType = subType;

    const templates = await DocumentTemplate.find(filter).sort({ documentType: 1, subType: 1, design: 1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await DocumentTemplate.findOne({ _id: req.params.id, ...tenantFilter(req) });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await DocumentTemplate.create({
      ...req.body,
      ...tenantFilter(req),
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedBy: req.user._id };
    delete updateData.tenantId;
    delete updateData.schoolId;

    const template = await DocumentTemplate.findOneAndUpdate(
      { _id: req.params.id, ...tenantFilter(req) },
      updateData,
      { new: true }
    );
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await DocumentTemplate.findOneAndUpdate(
      { _id: req.params.id, ...tenantFilter(req) },
      { isActive: false, updatedBy: req.user._id },
      { new: true }
    );
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, message: 'Template deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Seed default templates ───

exports.seedTemplates = async (req, res) => {
  try {
    const tf = tenantFilter(req);
    const existing = await DocumentTemplate.countDocuments(tf);
    if (existing > 0) {
      return res.json({ success: true, message: `${existing} templates already exist`, data: [] });
    }

    const defaultTemplates = [
      // Certificates - Official
      { name: 'Transfer Certificate - Classic', code: 'TC_CLASSIC', documentType: 'certificate', subType: 'tc', design: 'classic', title: 'TRANSFER CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, son/daughter of {{fatherName}}, was a bonafide student of {{schoolName}}. He/She was admitted on {{admissionDate}} and studied in Class {{class}}. His/Her date of birth as per school records is {{dob}}. He/She has left the school on {{leavingDate}}. His/Her character and conduct during the period of study have been satisfactory.', numbering: { prefix: 'TC', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Bonafide Certificate - Formal', code: 'BON_FORMAL', documentType: 'certificate', subType: 'bonafide', design: 'formal', title: 'BONAFIDE CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, is a bonafide student of {{schoolName}} studying in Class {{class}} - {{section}} for the academic session {{session}}. His/Her date of birth as per school records is {{dob}}.', numbering: { prefix: 'BON', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Character Certificate - Classic', code: 'CHAR_CLASSIC', documentType: 'certificate', subType: 'character', design: 'classic', title: 'CHARACTER CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, son/daughter of {{fatherName}}, is a student of {{schoolName}}. His/Her character and conduct have been good during the period of study. He/She bears a good moral character.', numbering: { prefix: 'CHAR', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'School Leaving Certificate', code: 'LC_CLASSIC', documentType: 'certificate', subType: 'leaving', design: 'classic', title: 'SCHOOL LEAVING CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, has been a student of {{schoolName}} from {{admissionDate}} to {{leavingDate}}. He/She was studying in Class {{class}}. The school has no objection to his/her leaving.', numbering: { prefix: 'LC', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Study Certificate', code: 'STUDY_CLASSIC', documentType: 'certificate', subType: 'study', design: 'classic', title: 'STUDY CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, son/daughter of {{fatherName}}, has studied in {{schoolName}} in Class {{class}} for the academic session {{session}}.', numbering: { prefix: 'STUDY', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Conduct Certificate', code: 'CONDUCT_CLASSIC', documentType: 'certificate', subType: 'conduct', design: 'classic', title: 'CONDUCT CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, has been a student of {{schoolName}}. His/Her conduct during the period of study has been satisfactory and to the best of my knowledge, he/she bears a good character.', numbering: { prefix: 'CONDUCT', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'No-Dues Certificate', code: 'NODUES_CLASSIC', documentType: 'certificate', subType: 'nodues', design: 'classic', title: 'NO-DUES CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, has cleared all dues towards {{schoolName}} as on {{issueDate}}.', numbering: { prefix: 'NODUES', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Promotion Certificate', code: 'PROMO_CLASSIC', documentType: 'certificate', subType: 'promotion', design: 'classic', title: 'PROMOTION CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, has been promoted to Class {{class}} for the academic session {{session}} based on satisfactory academic performance.', numbering: { prefix: 'PROMO', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Course Completion Certificate', code: 'COMP_CLASSIC', documentType: 'certificate', subType: 'completion', design: 'classic', title: 'COURSE COMPLETION CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, son/daughter of {{fatherName}}, has successfully completed the course of study in Class {{class}} at {{schoolName}} for the academic session {{session}}.', numbering: { prefix: 'COMP', numberLength: 4, includeAcademicYear: true, separator: '/' } },
      { name: 'Student Verification Certificate', code: 'VERIFY_CLASSIC', documentType: 'certificate', subType: 'verification', design: 'classic', title: 'STUDENT VERIFICATION CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, is/was a bonafide student of {{schoolName}}. The student studied in Class {{class}} - {{section}} during the academic session {{session}}. Date of birth as per records: {{dob}}.', numbering: { prefix: 'VER', numberLength: 4, includeAcademicYear: true, separator: '/' } },

      // Certificates - Achievement
      { name: 'Academic Excellence - Premium', code: 'EXCEL_PREMIUM', documentType: 'certificate', subType: 'academicExcellence', design: 'premium', title: 'CERTIFICATE OF ACADEMIC EXCELLENCE', bodyText: 'This is to certify that {{studentName}} of Class {{class}} - {{section}} has demonstrated outstanding academic excellence during the academic session {{session}}. This certificate is awarded in recognition of his/her exceptional performance and dedication to studies.', styling: { primaryColor: '#7c3aed', secondaryColor: '#a78bfa', accentColor: '#fbbf24', showBorder: true, showLogo: true } },
      { name: 'Merit Certificate - Classic', code: 'MERIT_CLASSIC', documentType: 'certificate', subType: 'merit', design: 'classic', title: 'MERIT CERTIFICATE', bodyText: 'This is to certify that {{studentName}} of Class {{class}} has been awarded this Merit Certificate for outstanding academic achievement during the session {{session}}.' },
      { name: 'Sports Achievement - Colorful', code: 'SPORTS_COLOR', documentType: 'certificate', subType: 'sportsAchievement', design: 'colorful', title: 'CERTIFICATE OF SPORTS ACHIEVEMENT', bodyText: 'This is to certify that {{studentName}} of Class {{class}} - {{section}} has demonstrated exceptional sporting ability and has been awarded this certificate for outstanding achievement in sports during the academic session {{session}}.', styling: { primaryColor: '#059669', secondaryColor: '#34d399', accentColor: '#fbbf24' } },
      { name: 'Participation Certificate', code: 'PART_CLASSIC', documentType: 'certificate', subType: 'participation', design: 'classic', title: 'CERTIFICATE OF PARTICIPATION', bodyText: 'This is to certify that {{studentName}} of Class {{class}} - {{section}} has actively participated in the event organized by {{schoolName}} during the academic session {{session}}.' },
      { name: 'Appreciation Certificate', code: 'APPREC_CLASSIC', documentType: 'certificate', subType: 'appreciation', design: 'classic', title: 'CERTIFICATE OF APPRECIATION', bodyText: 'This is to certify that {{studentName}} of Class {{class}} - {{section}} is hereby awarded this Certificate of Appreciation for commendable performance and positive contribution during the academic session {{session}}.' },
      { name: 'Best Student Certificate', code: 'BEST_CLASSIC', documentType: 'certificate', subType: 'bestStudent', design: 'premium', title: 'BEST STUDENT CERTIFICATE', bodyText: 'This is to certify that {{studentName}} of Class {{class}} - {{section}} has been selected as the Best Student of the academic session {{session}} for exemplary conduct, academic excellence, and overall outstanding performance.', styling: { primaryColor: '#d97706', secondaryColor: '#fbbf24', accentColor: '#7c3aed' } },

      // Marksheets
      { name: 'Standard Marksheet', code: 'MRK_STANDARD', documentType: 'marksheet', subType: 'standard', design: 'standard', title: 'REPORT CARD', marksheetColumns: { showTheory: false, showPractical: false, showMaxMarks: true, showPassMarks: false, showGrade: true, showPercentage: true, showRank: false, showRemarks: false } },
      { name: 'Detailed Marksheet', code: 'MRK_DETAILED', documentType: 'marksheet', subType: 'detailed', design: 'detailed', title: 'DEETAILED REPORT CARD', marksheetColumns: { showTheory: true, showPractical: true, showMaxMarks: true, showPassMarks: true, showGrade: true, showPercentage: true, showRank: true, showRemarks: true } },
      { name: 'Compact Marksheet', code: 'MRK_COMPACT', documentType: 'marksheet', subType: 'compact', design: 'compact', title: 'REPORT CARD', marksheetColumns: { showTheory: false, showPractical: false, showMaxMarks: true, showPassMarks: false, showGrade: true, showPercentage: false, showRank: false, showRemarks: false } },

      // ID Cards
      { name: 'Standard ID Card', code: 'IDC_STANDARD', documentType: 'idcard', subType: 'standard', design: 'standard', idCardFields: { front: { showDOB: false, showBloodGroup: false, showParentPhone: true, showAddress: false, showQRCode: false, showSession: true }, back: { showSchoolAddress: true, showContact: true, showInstructions: true, showSignature: true } } },
      { name: 'ID Card with QR', code: 'IDC_QR', documentType: 'idcard', subType: 'withQR', design: 'modern', idCardFields: { front: { showDOB: true, showBloodGroup: true, showParentPhone: true, showAddress: true, showQRCode: true, showSession: true }, back: { showSchoolAddress: true, showContact: true, showInstructions: true, showSignature: true } } },

      // Fee Documents
      { name: 'Fee Receipt', code: 'FEE_RECEIPT', documentType: 'feeDocument', subType: 'feeReceipt', design: 'standard', title: 'FEE RECEIPT', numbering: { prefix: 'FREC', numberLength: 5, includeAcademicYear: true, separator: '-' } },
      { name: 'Fee Statement', code: 'FEE_STMT', documentType: 'feeDocument', subType: 'feeStatement', design: 'standard', title: 'FEE STATEMENT', numbering: { prefix: 'FSTMT', numberLength: 5, includeAcademicYear: true, separator: '-' } },
      { name: 'Fee Due Notice', code: 'FEE_DUE', documentType: 'feeDocument', subType: 'feeDueNotice', design: 'standard', title: 'FEE DUE NOTICE', bodyText: 'Dear Parent, this is to inform you that the following fees are pending for {{studentName}}, Admission No. {{admissionNo}}. Kindly clear the dues at the earliest to avoid inconvenience.', numbering: { prefix: 'FDN', numberLength: 5, includeAcademicYear: true, separator: '-' } },
      { name: 'No-Dues Certificate (Fee)', code: 'FEE_NODUES', documentType: 'feeDocument', subType: 'noDues', design: 'standard', title: 'NO-DUES CERTIFICATE', bodyText: 'This is to certify that {{studentName}}, Admission No. {{admissionNo}}, has cleared all fee dues towards {{schoolName}} as on {{issueDate}}.', numbering: { prefix: 'NDC', numberLength: 4, includeAcademicYear: true, separator: '/' } },
    ];

    const created = await DocumentTemplate.insertMany(
      defaultTemplates.map(t => ({ ...t, ...tf, isSystem: true, createdBy: req.user._id }))
    );

    res.status(201).json({ success: true, data: created, message: `${created.length} templates created` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Generate Document ───

exports.generateDocument = async (req, res) => {
  try {
    const { studentId, templateId, documentType, subType, examId, feeInvoiceId, subjects, totalMarks, obtainedTotal, percentage, overallGrade, overallResult, rank, remarks, issueDate, customData } = req.body;

    if (!studentId || !templateId || !documentType) {
      return res.status(400).json({ success: false, error: 'studentId, templateId and documentType are required' });
    }

    const [student, school, template] = await Promise.all([
      Student.findOne({ _id: studentId, ...tenantFilter(req) }).populate('classId'),
      School.findById(req.user.schoolId),
      DocumentTemplate.findOne({ _id: templateId, ...tenantFilter(req) })
    ]);

    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

    const classDoc = student.classId;

    // Generate document number
    const numberingEntity = documentType === 'certificate' ? 'certificate' : documentType === 'marksheet' ? 'marksheet' : documentType === 'idcard' ? 'idcard' : 'document';
    const numberingConfig = template.numbering || {};
    const customPrefix = numberingConfig.prefix;
    const academicSession = student.academicSession || school.academicConfig?.currentSession || '';

    let documentNo;
    if (customPrefix) {
      // Use custom prefix from template
      const yearPart = numberingConfig.includeAcademicYear ? academicSession.slice(-5).replace('-', '/') : '';
      const seqFilter = { ...tenantFilter(req), entityType: `doc_${template.code}`, resetContext: yearPart };
      const NumberSequence = require('../models/NumberSequence');
      await NumberSequence.findOneAndUpdate(seqFilter, { $setOnInsert: { currentNumber: 0, prefix: customPrefix, numberLength: numberingConfig.numberLength || 4 } }, { upsert: true });
      const seq = await NumberSequence.findOneAndUpdate(seqFilter, { $inc: { currentNumber: 1 } }, { new: true });
      const num = String(seq.currentNumber).padStart(numberingConfig.numberLength || 4, '0');
      documentNo = yearPart ? `${customPrefix}${numberingConfig.separator || '/'}${yearPart}${numberingConfig.separator || '/'}${num}` : `${customPrefix}${numberingConfig.separator || '/'}${num}`;
    } else {
      documentNo = await getNextNumber({ ...tenantFilter(req), entityType: numberingEntity, academicSession });
    }

    // Build options for variable resolution
    const options = { documentNo, issueDate: issueDate || new Date(), examName: '', totalMarks, obtainedTotal, percentage, overallGrade, overallResult, rank };

    // For marksheets, get exam info
    if (documentType === 'marksheet' && examId) {
      const exam = await Exam.findOne({ _id: examId, ...tenantFilter(req) });
      if (exam) options.examName = exam.name;
    }

    // For fee documents, get invoice
    let invoice = null;
    if (documentType === 'feeDocument' && feeInvoiceId) {
      invoice = await FeeInvoice.findOne({ _id: feeInvoiceId, ...tenantFilter(req) });
    }

    const variables = await resolveVariables(student, school, classDoc, options);

    // Build data for rendering
    const renderData = {
      student,
      subjects: subjects || [],
      totalMarks,
      obtainedTotal,
      percentage,
      overallGrade,
      overallResult,
      rank,
      remarks,
      invoice,
      subType,
      ...customData
    };

    // Generate PDF
    const pdfBuffer = await generatePdf(documentType, renderData, school, template, variables);

    // Save generated document record
    const dataSnapshot = {
      studentName: variables['{{studentName}}'],
      admissionNo: variables['{{admissionNo}}'],
      className: variables['{{class}}'],
      section: variables['{{section}}'],
      session: variables['{{session}}'],
      fatherName: variables['{{fatherName}}'],
      dob: variables['{{dob}}'],
    };

    const genDoc = await GeneratedDocument.create({
      ...tenantFilter(req),
      documentNo,
      documentType,
      subType: subType || template.subType || '',
      design: template.design,
      studentId: student._id,
      classId: classDoc?._id,
      academicSession,
      templateId: template._id,
      templateSnapshot: {
        title: template.title,
        bodyText: template.bodyText,
        footerText: template.footerText,
        layout: template.layout,
        styling: template.styling,
        marksheetColumns: template.marksheetColumns,
        idCardFields: template.idCardFields,
        signatures: template.signatures,
      },
      dataSnapshot,
      examId: examId || undefined,
      examName: options.examName,
      subjects: subjects || [],
      totalMarks,
      obtainedTotal,
      percentage,
      overallGrade,
      overallResult,
      rank,
      remarks,
      feeInvoiceId: feeInvoiceId || undefined,
      generatedBy: req.user._id,
    });

    // Send PDF
    const filename = `${documentType}-${documentNo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('generateDocument error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Preview Document (no save) ───

exports.previewDocument = async (req, res) => {
  try {
    const { studentId, templateId, documentType, subjects, totalMarks, obtainedTotal, percentage, overallGrade, overallResult, rank, remarks, examId, feeInvoiceId, customData } = req.body;

    if (!templateId || !documentType) {
      return res.status(400).json({ success: false, error: 'templateId and documentType are required' });
    }

    const [student, school, template] = await Promise.all([
      studentId ? Student.findOne({ _id: studentId, ...tenantFilter(req) }).populate('classId') : null,
      School.findById(req.user.schoolId),
      DocumentTemplate.findOne({ _id: templateId, ...tenantFilter(req) })
    ]);

    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

    const classDoc = student?.classId;
    const options = { documentNo: 'PREVIEW', issueDate: new Date(), examName: '', totalMarks, obtainedTotal, percentage, overallGrade, overallResult, rank };

    if (documentType === 'marksheet' && examId) {
      const exam = await Exam.findOne({ _id: examId, ...tenantFilter(req) });
      if (exam) options.examName = exam.name;
    }

    let invoice = null;
    if (documentType === 'feeDocument' && feeInvoiceId) {
      invoice = await FeeInvoice.findOne({ _id: feeInvoiceId, ...tenantFilter(req) });
    }

    const variables = await resolveVariables(student, school, classDoc, options);
    const renderData = { student, subjects: subjects || [], totalMarks, obtainedTotal, percentage, overallGrade, overallResult, rank, remarks, invoice, ...customData };

    const pdfBuffer = await generatePdf(documentType, renderData, school, template, variables);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('previewDocument error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Generated Documents History ───

exports.getDocuments = async (req, res) => {
  try {
    const { documentType, studentId, classId, status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { ...tenantFilter(req) };

    if (documentType) filter.documentType = documentType;
    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;
    if (status) filter.status = status;
    if (search) filter.documentNo = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.generatedAt = {};
      if (startDate) filter.generatedAt.$gte = new Date(startDate);
      if (endDate) filter.generatedAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      GeneratedDocument.find(filter)
        .populate('studentId', 'admissionNo personalInfo.firstName personalInfo.lastName')
        .populate('classId', 'name')
        .populate('generatedBy', 'name')
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GeneratedDocument.countDocuments(filter)
    ]);

    res.json({ success: true, data: docs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const doc = await GeneratedDocument.findOne({ _id: req.params.id, ...tenantFilter(req) })
      .populate('studentId', 'admissionNo personalInfo')
      .populate('classId', 'name')
      .populate('generatedBy', 'name')
      .populate('templateId');
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Regenerate PDF from saved document ───

exports.regeneratePdf = async (req, res) => {
  try {
    const genDoc = await GeneratedDocument.findOne({ _id: req.params.id, ...tenantFilter(req) })
      .populate('studentId')
      .populate('classId');

    if (!genDoc) return res.status(404).json({ success: false, error: 'Document not found' });
    if (genDoc.status === 'void') return res.status(400).json({ success: false, error: 'Cannot regenerate a voided document' });

    const school = await School.findById(req.user.schoolId);
    const template = await DocumentTemplate.findById(genDoc.templateId);

    // Use snapshot if template is deleted
    const effectiveTemplate = template || {
      ...genDoc.templateSnapshot,
      signatures: genDoc.templateSnapshot.signatures
    };

    const options = {
      documentNo: genDoc.documentNo,
      issueDate: genDoc.generatedAt,
      examName: genDoc.examName,
      totalMarks: genDoc.totalMarks,
      obtainedTotal: genDoc.obtainedTotal,
      percentage: genDoc.percentage,
      overallGrade: genDoc.overallGrade,
      overallResult: genDoc.overallResult,
      rank: genDoc.rank,
    };

    const variables = await resolveVariables(genDoc.studentId, school, genDoc.classId, options);
    const renderData = {
      student: genDoc.studentId,
      subjects: genDoc.subjects || [],
      totalMarks: genDoc.totalMarks,
      obtainedTotal: genDoc.obtainedTotal,
      percentage: genDoc.percentage,
      overallGrade: genDoc.overallGrade,
      overallResult: genDoc.overallResult,
      rank: genDoc.rank,
      remarks: genDoc.remarks,
    };

    const pdfBuffer = await generatePdf(genDoc.documentType, renderData, school, effectiveTemplate, variables);

    const filename = `${genDoc.documentType}-${genDoc.documentNo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('regeneratePdf error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Void/Cancel Document ───

exports.voidDocument = async (req, res) => {
  try {
    const { reason } = req.body;
    const doc = await GeneratedDocument.findOneAndUpdate(
      { _id: req.params.id, ...tenantFilter(req) },
      {
        status: 'void',
        voidReason: reason || '',
        voidedBy: req.user._id,
        voidedAt: new Date()
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    res.json({ success: true, data: doc, message: 'Document voided' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Get Student Documents ───

exports.getStudentDocuments = async (req, res) => {
  try {
    const docs = await GeneratedDocument.find({
      ...tenantFilter(req),
      studentId: req.params.studentId,
      status: 'active'
    })
      .populate('classId', 'name')
      .populate('generatedBy', 'name')
      .sort({ generatedAt: -1 });

    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Bulk Generation ───

exports.bulkGenerate = async (req, res) => {
  try {
    const { studentIds, templateId, documentType, subType, examId, subjects: sharedSubjects, issueDate } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'studentIds array is required' });
    }
    if (!templateId || !documentType) {
      return res.status(400).json({ success: false, error: 'templateId and documentType are required' });
    }

    const [school, template] = await Promise.all([
      School.findById(req.user.schoolId),
      DocumentTemplate.findOne({ _id: templateId, ...tenantFilter(req) })
    ]);

    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const student = await Student.findOne({ _id: studentId, ...tenantFilter(req) }).populate('classId');
        if (!student) { errors.push({ studentId, error: 'Student not found' }); continue; }

        const classDoc = student.classId;
        const academicSession = student.academicSession || school.academicConfig?.currentSession || '';

        // Generate document number
        const numberingEntity = documentType === 'certificate' ? 'certificate' : documentType === 'marksheet' ? 'marksheet' : documentType === 'idcard' ? 'idcard' : 'document';
        const numberingConfig = template.numbering || {};
        const customPrefix = numberingConfig.prefix;

        let documentNo;
        if (customPrefix) {
          const yearPart = numberingConfig.includeAcademicYear ? academicSession.slice(-5).replace('-', '/') : '';
          const NumberSequence = require('../models/NumberSequence');
          const seqFilter = { ...tenantFilter(req), entityType: `doc_${template.code}`, resetContext: yearPart };
          await NumberSequence.findOneAndUpdate(seqFilter, { $setOnInsert: { currentNumber: 0, prefix: customPrefix, numberLength: numberingConfig.numberLength || 4 } }, { upsert: true });
          const seq = await NumberSequence.findOneAndUpdate(seqFilter, { $inc: { currentNumber: 1 } }, { new: true });
          const num = String(seq.currentNumber).padStart(numberingConfig.numberLength || 4, '0');
          documentNo = yearPart ? `${customPrefix}${numberingConfig.separator || '/'}${yearPart}${numberingConfig.separator || '/'}${num}` : `${customPrefix}${numberingConfig.separator || '/'}${num}`;
        } else {
          documentNo = await getNextNumber({ ...tenantFilter(req), entityType: numberingEntity, academicSession });
        }

        const options = { documentNo, issueDate: issueDate || new Date(), examName: '', totalMarks: 0, obtainedTotal: 0, percentage: 0 };

        if (documentType === 'marksheet' && examId) {
          const exam = await Exam.findOne({ _id: examId, ...tenantFilter(req) });
          if (exam) options.examName = exam.name;
        }

        const variables = await resolveVariables(student, school, classDoc, options);
        const renderData = { student, subjects: sharedSubjects || [], totalMarks: 0, obtainedTotal: 0 };

        const pdfBuffer = await generatePdf(documentType, renderData, school, template, variables);

        // Save record
        const genDoc = await GeneratedDocument.create({
          ...tenantFilter(req),
          documentNo,
          documentType,
          subType: subType || template.subType || '',
          design: template.design,
          studentId: student._id,
          classId: classDoc?._id,
          academicSession,
          templateId: template._id,
          templateSnapshot: {
            title: template.title,
            bodyText: template.bodyText,
            footerText: template.footerText,
            layout: template.layout,
            styling: template.styling,
            marksheetColumns: template.marksheetColumns,
            idCardFields: template.idCardFields,
            signatures: template.signatures,
          },
          dataSnapshot: {
            studentName: variables['{{studentName}}'],
            admissionNo: variables['{{admissionNo}}'],
            className: variables['{{class}}'],
            section: variables['{{section}}'],
          },
          examId: examId || undefined,
          examName: options.examName,
          generatedBy: req.user._id,
        });

        results.push({ studentId, documentNo, docId: genDoc._id, studentName: variables['{{studentName}}'] });
      } catch (err) {
        errors.push({ studentId, error: err.message });
      }
    }

    res.json({ success: true, data: results, errors, total: results.length, failed: errors.length });
  } catch (error) {
    console.error('bulkGenerate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Get Certificate Types ───

exports.getCertificateTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        official: [
          { code: 'tc', name: 'Transfer Certificate (TC)' },
          { code: 'bonafide', name: 'Bonafide Certificate' },
          { code: 'character', name: 'Character Certificate' },
          { code: 'leaving', name: 'School Leaving Certificate' },
          { code: 'study', name: 'Study Certificate' },
          { code: 'verification', name: 'Student Verification Certificate' },
          { code: 'conduct', name: 'Conduct Certificate' },
          { code: 'promotion', name: 'Promotion Certificate' },
          { code: 'completion', name: 'Course/Class Completion Certificate' },
          { code: 'nodues', name: 'No-Dues Certificate' },
        ],
        achievement: [
          { code: 'academicExcellence', name: 'Academic Excellence Certificate' },
          { code: 'merit', name: 'Merit Certificate' },
          { code: 'topper', name: 'Topper Certificate' },
          { code: 'rank', name: 'Rank Certificate' },
          { code: 'sportsAchievement', name: 'Sports Achievement Certificate' },
          { code: 'competitionWinner', name: 'Competition Winner Certificate' },
          { code: 'participation', name: 'Participation Certificate' },
          { code: 'culturalActivity', name: 'Cultural Activity Certificate' },
          { code: 'artCraft', name: 'Art & Craft Certificate' },
          { code: 'quizOlympiad', name: 'Quiz/Olympiad Certificate' },
          { code: 'discipline', name: 'Discipline Certificate' },
          { code: 'bestStudent', name: 'Best Student Certificate' },
          { code: 'appreciation', name: 'Appreciation Certificate' },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Get Dynamic Variables List ───

exports.getVariables = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        student: [
          { var: '{{studentName}}', label: 'Student Name' },
          { var: '{{firstName}}', label: 'First Name' },
          { var: '{{lastName}}', label: 'Last Name' },
          { var: '{{fatherName}}', label: "Father's Name" },
          { var: '{{motherName}}', label: "Mother's Name" },
          { var: '{{admissionNo}}', label: 'Admission Number' },
          { var: '{{rollNo}}', label: 'Roll Number' },
          { var: '{{class}}', label: 'Class' },
          { var: '{{section}}', label: 'Section' },
          { var: '{{session}}', label: 'Academic Session' },
          { var: '{{dob}}', label: 'Date of Birth' },
          { var: '{{gender}}', label: 'Gender' },
          { var: '{{bloodGroup}}', label: 'Blood Group' },
          { var: '{{address}}', label: 'Address' },
          { var: '{{phone}}', label: 'Phone' },
          { var: '{{fatherPhone}}', label: "Father's Phone" },
          { var: '{{admissionDate}}', label: 'Admission Date' },
          { var: '{{previousSchool}}', label: 'Previous School' },
        ],
        school: [
          { var: '{{schoolName}}', label: 'School Name' },
          { var: '{{schoolAddress}}', label: 'School Address' },
          { var: '{{schoolPhone}}', label: 'School Phone' },
          { var: '{{schoolEmail}}', label: 'School Email' },
          { var: '{{schoolWebsite}}', label: 'School Website' },
          { var: '{{affiliationNo}}', label: 'Affiliation Number' },
          { var: '{{schoolCode}}', label: 'School Code' },
          { var: '{{board}}', label: 'Board' },
          { var: '{{motto}}', label: 'School Motto' },
        ],
        signatures: [
          { var: '{{principalName}}', label: 'Principal Name' },
          { var: '{{managerName}}', label: 'Manager Name' },
          { var: '{{classTeacherName}}', label: 'Class Teacher Name' },
        ],
        document: [
          { var: '{{certificateNo}}', label: 'Certificate Number' },
          { var: '{{issueDate}}', label: 'Issue Date' },
          { var: '{{currentDate}}', label: 'Current Date' },
        ],
        exam: [
          { var: '{{examName}}', label: 'Exam Name' },
          { var: '{{totalMarks}}', label: 'Total Marks' },
          { var: '{{obtainedTotal}}', label: 'Obtained Total' },
          { var: '{{percentage}}', label: 'Percentage' },
          { var: '{{grade}}', label: 'Grade' },
          { var: '{{result}}', label: 'Result' },
          { var: '{{rank}}', label: 'Rank' },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Generate Report (generic) ───

exports.generateReport = async (req, res) => {
  try {
    const { title, subtitle, filters, columns, rows, summary, orientation, generatedBy } = req.body;

    if (!title || !columns || !rows) {
      return res.status(400).json({ success: false, error: 'title, columns and rows are required' });
    }

    const orchestrator = new DocumentEngineOrchestrator();
    const pdfBuffer = await orchestrator.generate('report', {
      schoolId: req.user.schoolId,
      title, subtitle, filters, columns, rows, summary,
      orientation: orientation || 'portrait',
      generatedBy: generatedBy || req.user.name || 'System',
    });

    const documentNo = await getNextNumber({
      ...tenantFilter(req),
      entityType: 'document',
      academicSession: new Date().getFullYear().toString(),
    });

    await GeneratedDocument.create({
      ...tenantFilter(req),
      documentNo,
      documentType: 'report',
      status: 'active',
      reportTitle: title,
      reportSubtitle: subtitle,
      reportFilters: filters,
      reportColumns: columns,
      reportRows: rows,
      reportSummary: summary,
      reportOrientation: orientation || 'portrait',
      generatedBy: req.user._id,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('generateReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Generate Notice / Circular ───

exports.generateNotice = async (req, res) => {
  try {
    const { title, subject, audience, body, content, referenceNumber, date, isCircular, attachments } = req.body;

    if (!body && !content) {
      return res.status(400).json({ success: false, error: 'body or content is required' });
    }

    const orchestrator = new DocumentEngineOrchestrator();
    const pdfBuffer = await orchestrator.generate(isCircular ? 'circular' : 'notice', {
      schoolId: req.user.schoolId,
      title, subject, audience, body: body || content,
      referenceNumber, date: date || new Date(),
      isCircular, attachments,
    });

    const documentNo = await getNextNumber({
      ...tenantFilter(req),
      entityType: 'notice',
      academicSession: new Date().getFullYear().toString(),
    });

    await GeneratedDocument.create({
      ...tenantFilter(req),
      documentNo,
      documentType: 'letter',
      subType: isCircular ? 'circular' : 'notice',
      status: 'issued',
      generatedBy: req.user._id,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${isCircular ? 'circular' : 'notice'}-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('generateNotice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Generate Salary Slip ───

exports.generateSalarySlipDoc = async (req, res) => {
  try {
    const { employeeName, employeeId, designation, department, month, year, basicSalary, hra, da, allowances, otherEarnings, pf, esi, tds, otherDeductions, grossSalary, totalDeductions, netSalary, paymentDate, paymentMode, transactionId, workingDays, paidDays } = req.body;

    if (!employeeName || !month || !year) {
      return res.status(400).json({ success: false, error: 'employeeName, month and year are required' });
    }

    const orchestrator = new DocumentEngineOrchestrator();
    const pdfBuffer = await orchestrator.generate('salarySlip', {
      schoolId: req.user.schoolId,
      employeeName, employeeId, designation, department,
      month, year, basicSalary, hra, da, allowances, otherEarnings,
      pf, esi, tds, otherDeductions,
      grossSalary, totalDeductions, netSalary,
      paymentDate, paymentMode, transactionId,
      workingDays, paidDays,
    });

    const documentNo = await getNextNumber({
      ...tenantFilter(req),
      entityType: 'salarySlip',
      academicSession: new Date().getFullYear().toString(),
    });

    await GeneratedDocument.create({
      ...tenantFilter(req),
      documentNo,
      documentType: 'salarySlip',
      status: 'issued',
      generatedBy: req.user._id,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${month}-${year}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('generateSalarySlipDoc error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Public Document Verification ───

exports.verifyDocument = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, error: 'Verification token is required' });

    const verification = await DocumentVerification.findOne({ verificationToken: token, isActive: true });
    if (!verification) return res.status(404).json({ success: false, error: 'Document not found or verification expired' });

    res.json({
      success: true,
      verified: true,
      data: verification.publicInfo,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Update Document Settings ───

exports.updateDocumentSettings = async (req, res) => {
  try {
    const { documentSettings } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    school.documentSettings = { ...school.documentSettings, ...documentSettings };
    await school.save();

    res.json({ success: true, documentSettings: school.documentSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Get Document Settings ───

exports.getDocumentSettings = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    res.json({ success: true, documentSettings: school.documentSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

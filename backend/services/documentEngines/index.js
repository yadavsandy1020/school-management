const FinancialDocumentEngine = require('./financialEngine');
const CertificateDocumentEngine = require('./certificateEngine');
const CardDocumentEngine = require('./cardEngine');
const ReportDocumentEngine = require('./reportEngine');
const LetterDocumentEngine = require('./letterEngine');
const ReportCardEngine = require('./reportCardEngine');
const School = require('../../models/School');
const { generateVerificationToken } = require('./baseEngine');

const financial = new FinancialDocumentEngine();
const certificate = new CertificateDocumentEngine();
const card = new CardDocumentEngine();
const report = new ReportDocumentEngine();
const letter = new LetterDocumentEngine();
const reportCard = new ReportCardEngine();

/**
 * DocumentEngineOrchestrator — routes document generation to the correct engine.
 * This replaces the old documentEngine.js with the new multi-engine architecture.
 */
class DocumentEngineOrchestrator {
  async loadSchool(schoolId) {
    return School.findById(schoolId);
  }

  /**
   * Route to the correct engine based on document type.
   */
  async generate(type, data, options = {}) {
    const schoolId = data.schoolId;
    if (!schoolId) throw new Error('schoolId is required');

    const school = await this.loadSchool(schoolId);
    if (!school) throw new Error('School not found');

    // Generate verification token if QR is enabled
    if (school?.documentSettings?.verification?.qrEnabled) {
      const token = generateVerificationToken();
      const verificationUrl = financial.getVerificationUrl(school, token);
      data.verificationUrl = verificationUrl;
      data.verificationToken = token;
    }

    const router = {
      // Financial documents
      feeReceipt: () => financial.generateFeeReceipt(school, data, options),
      feeInvoice: () => financial.generateFeeInvoice(school, data, options),
      invoice: () => financial.generateFeeInvoice(school, data, options),
      salarySlip: () => financial.generateSalarySlip(school, data, options),

      // Certificates
      transferCertificate: () => certificate.generateTransferCertificate(school, data, options),
      tc: () => certificate.generateTransferCertificate(school, data, options),
      bonafideCertificate: () => certificate.generateBonafideCertificate(school, data, options),
      bonafide: () => certificate.generateBonafideCertificate(school, data, options),
      characterCertificate: () => certificate.generateCertificate(school, { ...data, title: 'CHARACTER CERTIFICATE' }, options),
      studyCertificate: () => certificate.generateCertificate(school, { ...data, title: 'STUDY CERTIFICATE' }, options),
      conductCertificate: () => certificate.generateCertificate(school, { ...data, title: 'CONDUCT CERTIFICATE' }, options),
      certificate: () => certificate.generateCertificate(school, data, options),

      // Cards
      studentIdCard: () => card.generateStudentIdCard(school, data, options),
      employeeIdCard: () => card.generateEmployeeIdCard(school, data, options),
      admitCard: () => card.generateAdmitCard(school, data, options),

      // Report card / marksheet
      reportCard: () => reportCard.generateReportCard(school, data, options),
      marksheet: () => reportCard.generateReportCard(school, data, options),

      // Reports
      report: () => report.generateReport(school, data, options),
      paymentReport: () => {
        const reportData = {
          schoolId: school._id,
          title: 'PAYMENT REPORT',
          subtitle: data.student ? `Student: ${data.student} | Adm No: ${data.admissionNo || ''} | Class: ${data.className || ''}` : '',
          filters: {
            'Academic Session': data.academicSession || '',
            'Student': data.student || '',
          },
          columns: [
            { label: 'Invoice No', key: 'invoiceNo', align: 'left' },
            { label: 'Installment', key: 'installmentLabel', align: 'center' },
            { label: 'Total Amount', key: 'totalAmount', align: 'right' },
            { label: 'Paid', key: 'paidAmount', align: 'right' },
            { label: 'Balance', key: 'balanceAmount', align: 'right' },
            { label: 'Status', key: 'status', align: 'center' },
          ],
          rows: (data.invoices || []).map(inv => ({
            invoiceNo: inv.invoiceNo,
            installmentLabel: inv.installmentLabel || inv.quarter || '-',
            totalAmount: `Rs. ${Number(inv.totalAmount || 0).toLocaleString('en-IN')}`,
            paidAmount: `Rs. ${Number(inv.paidAmount || 0).toLocaleString('en-IN')}`,
            balanceAmount: `Rs. ${Number(inv.balanceAmount || 0).toLocaleString('en-IN')}`,
            status: inv.status || '-',
          })),
          summary: {
            'Total Billed': `Rs. ${Number(data.totalBilled || 0).toLocaleString('en-IN')}`,
            'Total Paid': `Rs. ${Number(data.totalPaid || 0).toLocaleString('en-IN')}`,
            'Outstanding': `Rs. ${Number(data.totalOutstanding || 0).toLocaleString('en-IN')}`,
          },
        };
        return report.generateReport(school, reportData, options);
      },

      // Letters
      notice: () => letter.generateNotice(school, data, options),
      circular: () => letter.generateNotice(school, { ...data, isCircular: true }, options),
    };

    const handler = router[type];
    if (!handler) throw new Error(`Unknown document type: ${type}`);

    return handler();
  }
}

module.exports = DocumentEngineOrchestrator;

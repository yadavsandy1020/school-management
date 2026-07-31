const { BaseEngine, clean, formatDate } = require('./baseEngine');

/**
 * LetterDocumentEngine — notices, circulars, official letters.
 * Clean, minimal, professional. No filled colored bars.
 */
class LetterDocumentEngine extends BaseEngine {
  async generateNotice(school, data, options = {}) {
    const margin = 40;
    const doc = this.createDoc({ size: 'A4', margins: { top: margin, bottom: margin, left: margin, right: margin } });
    const bufferPromise = this.collectBuffer(doc);
    const contentWidth = doc.page.width - margin * 2;

    this.drawWatermark(doc, school);
    this.drawHeader(doc, school, { margin });

    // Reference number and date — subtle
    doc.y += 8;
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    if (data.referenceNumber) {
      doc.text(`Ref: ${clean(data.referenceNumber)}`, margin, doc.y, { width: contentWidth / 2 });
    }
    doc.text(`Date: ${formatDate(data.date || new Date())}`, margin + contentWidth / 2, doc.y, { width: contentWidth / 2, align: 'right' });

    // Title — clean, bold, centered, no colored bar
    doc.y += 16;
    this.drawTitle(doc, data.title || (data.isCircular ? 'Circular' : 'Notice'), { margin, fontSize: 16 });

    // Subject
    if (data.subject) {
      doc.y += 8;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(`Subject: ${clean(data.subject)}`, margin, doc.y, { width: contentWidth });
      doc.y += 8;
    }

    // Recipient/Audience
    if (data.audience || data.recipient) {
      doc.fontSize(10).font('Helvetica').fillColor('#374151');
      doc.text(clean(data.audience || data.recipient), margin, doc.y, { width: contentWidth });
      doc.y += 8;
    }

    // Body — clean, justified, good line spacing
    if (data.body || data.content) {
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      const body = data.body || data.content;
      const paragraphs = body.split(/\n\n+/);
      paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (!trimmed) return;
        doc.text(trimmed, margin, doc.y + 4, { align: 'justify', width: contentWidth, lineGap: 6 });
      });
    }

    // Attachments — subtle
    if (data.attachments && data.attachments.length) {
      doc.y += 12;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('Attachments', margin, doc.y, { width: contentWidth });
      doc.font('Helvetica').fontSize(9).fillColor('#9ca3af');
      data.attachments.forEach(att => {
        doc.text(`· ${clean(att.name || att)}`, margin, doc.y + 2, { width: contentWidth });
      });
    }

    // Signatory
    doc.y += 24;
    this.drawSignatures(doc, school, { margin, signatureY: doc.y + 10 });

    this.drawFooter(doc, school, { margin });

    doc.end();
    return bufferPromise;
  }
}

module.exports = LetterDocumentEngine;

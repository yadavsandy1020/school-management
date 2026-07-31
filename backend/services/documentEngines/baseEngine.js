const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const clean = (val) => (val === undefined || val === null) ? '' : String(val);

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n) => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };

  const threeDigits = (n) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let str = '';
    if (h) str += ones[h] + ' Hundred';
    if (r) str += (h ? ' ' : '') + twoDigits(r);
    return str;
  };

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let words = '';
  if (intPart >= 10000000) {
    words += threeDigits(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  const rem1 = intPart % 10000000;
  if (rem1 >= 100000) {
    words += threeDigits(Math.floor(rem1 / 100000)) + ' Lakh ';
  }
  const rem2 = rem1 % 100000;
  if (rem2 >= 1000) {
    words += threeDigits(Math.floor(rem2 / 1000)) + ' Thousand ';
  }
  const rem3 = rem2 % 1000;
  if (rem3 > 0) {
    words += threeDigits(rem3);
  }
  words = words.trim();
  if (decPart > 0) {
    words += ' and ' + twoDigits(decPart) + ' Paise';
  }
  return words + ' Only';
};

const getFullAddress = (address) => {
  const parts = [address?.street, address?.city, address?.district, address?.state, address?.pincode].filter(Boolean);
  return parts.join(', ');
};

const getContactLine = (contact) => {
  const parts = [];
  if (contact?.phone) parts.push(`Phone: ${contact.phone}`);
  if (contact?.email) parts.push(`Email: ${contact.email}`);
  if (contact?.website) parts.push(`Website: ${contact.website}`);
  return parts.join(' | ');
};

const resolveImagePath = (imgPath) => {
  if (!imgPath) return null;
  const full = imgPath.startsWith('/') ? path.join(__dirname, '..', '..', imgPath) : imgPath;
  try {
    if (fs.existsSync(full)) return full;
  } catch (e) { /* ignore */ }
  return null;
};

const generateVerificationToken = () => crypto.randomBytes(16).toString('hex');

/**
 * BaseEngine — shared header, footer, signatures, seal, QR, watermark, table helpers.
 * Supports both 'standard' and 'modern' template styles.
 */
class BaseEngine {
  constructor() {
    this.clean = clean;
    this.formatDate = formatDate;
    this.formatCurrency = formatCurrency;
    this.numberToWords = numberToWords;
  }

  /**
   * Resolve which template style to use: per-document override or school default.
   */
  resolveTemplateStyle(school, documentKey) {
    const ds = school?.documentSettings || {};
    const override = ds.templateOverrides?.[documentKey];
    if (override) return override;
    return ds.defaultTemplate || 'standard';
  }

  /**
   * Create a PDFKit document with appropriate page size and margins.
   */
  createDoc(options = {}) {
    const { size = 'A4', orientation = 'portrait', margins } = options;
    const opts = {
      size,
      layout: orientation === 'landscape' ? 'landscape' : 'portrait',
      margins: margins || 40,
    };
    return new PDFDocument(opts);
  }

  /**
   * Collect PDF buffer from a doc.
   */
  collectBuffer(doc) {
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  /**
   * Draw the school document header — clean, minimal, premium.
   * [Logo]  School Name
   *          Affiliation · Address · Contact
   *          ────────────────────────────────
   */
  drawHeader(doc, school, options = {}) {
    const ds = school?.documentSettings?.header || {};
    if ((ds.style || 'standard') === 'none') return;

    const margin = options.margin || 40;
    const contentWidth = doc.page.width - margin * 2;
    let y = margin;

    const hasLogo = ds.showLogo !== false && school?.logo && resolveImagePath(school.logo);
    const logoSize = 32;
    const textX = hasLogo ? margin + logoSize + 10 : margin;
    const textW = contentWidth - (hasLogo ? logoSize + 10 : 0);

    // Logo on left
    if (hasLogo) {
      try {
        doc.image(resolveImagePath(school.logo), margin, y, { width: logoSize, height: logoSize, fit: true });
      } catch (e) { /* ignore */ }
    }

    // School name — bold, dark
    if (ds.showName !== false && school?.name) {
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(school.name, textX, y, { width: textW });
      y = doc.y;
    }

    // Line 1: board · affiliation · address — small gray
    const line1Parts = [];
    if (ds.showBoard && school?.board) line1Parts.push(school.board);
    if (ds.showAffiliationNumber && school?.affiliationNumber) line1Parts.push(`Aff No: ${school.affiliationNumber}`);
    if (ds.showSchoolCode && school?.schoolCode) line1Parts.push(`Code: ${school.schoolCode}`);
    if (ds.showAddress && school?.address) {
      const addrParts = [school.address.line1 || school.address.street, school.address.city, school.address.state, school.address.pincode].filter(Boolean);
      if (addrParts.length) line1Parts.push(addrParts.join(', '));
    }
    if (line1Parts.length) {
      doc.fontSize(7.5).font('Helvetica').fillColor('#9ca3af');
      doc.text(line1Parts.join('  ·  '), textX, y + 1, { width: textW });
      y = doc.y;
    }

    // Line 2: phone · email · website — small gray
    const line2Parts = [];
    if (ds.showContact && school?.contact?.phone) line2Parts.push(`Ph: ${school.contact.phone}`);
    if (ds.showEmail && school?.contact?.email) line2Parts.push(school.contact.email);
    if (ds.showWebsite && school?.contact?.website) line2Parts.push(school.contact.website);
    if (line2Parts.length) {
      doc.fontSize(7.5).font('Helvetica').fillColor('#9ca3af');
      doc.text(line2Parts.join('  ·  '), textX, y + 1, { width: textW });
      y = doc.y;
    }

    // Ensure y is below both logo and text
    if (hasLogo) y = Math.max(y, margin + logoSize);

    // Thin neutral gray divider
    y += 6;
    doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.y = y + 14;
    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw the school document footer — minimal, centered, small gray text.
   */
  drawFooter(doc, school, options = {}) {
    const ds = school?.documentSettings?.footer || {};
    if ((ds.style || 'standard') === 'none') return;

    const margin = options.margin || 40;
    const contentWidth = doc.page.width - margin * 2;
    const footerHeight = options.footerHeight || 45;
    // Position footer so its text stays within the printable area (above bottom margin)
    const y = doc.page.height - margin - footerHeight;

    // Thin divider
    doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    let textY = y + 6;

    // Primary footer line
    const parts = [];
    if (ds.customText) parts.push(ds.customText);
    else if (ds.disclaimer) parts.push(ds.disclaimer);
    if (ds.showWebsite && school?.contact?.website) parts.push(school.contact.website);
    if (ds.showPoweredBy) parts.push('Powered by EduPilot');
    if (parts.length) {
      doc.fontSize(7.5).font('Helvetica').fillColor('#9ca3af');
      doc.text(parts.join('  ·  '), margin, textY, { align: 'center', width: contentWidth, lineBreak: false });
      textY = doc.y + 3;
    }

    // Computer generated text + page number
    const metaParts = [];
    if (ds.computerGeneratedText) metaParts.push(ds.computerGeneratedText);
    else metaParts.push('This is a computer-generated document.');
    if (ds.showPageNumber) metaParts.push(`Page ${doc.page.number || 1} of 1`);
    if (metaParts.length) {
      doc.fontSize(6.5).font('Helvetica').fillColor('#d1d5db');
      doc.text(metaParts.join('  ·  '), margin, textY, { align: 'center', width: contentWidth, lineBreak: false });
    }

    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw signatures — simple horizontal layout with thin lines.
   */
  drawSignatures(doc, school, options = {}) {
    const sigs = school?.documentSettings?.signatures || {};
    const margin = options.margin || 40;
    const contentWidth = doc.page.width - margin * 2;
    // Default: 90pt from bottom (above footer)
    const y = options.signatureY || (doc.page.height - 90);

    const activeSigs = Object.entries(sigs).filter(([key, sig]) => sig?.show && sig?.name);
    if (activeSigs.length === 0) {
      // Default: principal only, centered
      this._drawSingleSignature(doc, school, (doc.page.width - 120) / 2, y, 'Principal', sigs.principal?.name || school?.officials?.principalName || '');
      return;
    }

    const spacing = contentWidth / Math.max(activeSigs.length, 1);
    activeSigs.forEach(([key, sig], i) => {
      const x = margin + spacing * i + spacing / 2 - 60;
      this._drawSingleSignature(doc, school, x, y, sig.title || key, sig.name);
    });
  }

  _drawSingleSignature(doc, school, x, y, label, name) {
    // Signature image if available
    const sigKey = label.toLowerCase();
    const sigConfig = school?.documentSettings?.signatures?.[sigKey] ||
      Object.values(school?.documentSettings?.signatures || {}).find(s => s?.title === label);
    const imgPath = resolveImagePath(sigConfig?.image);
    if (imgPath) {
      try {
        doc.image(imgPath, x, y - 28, { width: 80, height: 28 });
      } catch (e) { /* ignore */ }
    }

    // Simple thin line
    doc.moveTo(x, y).lineTo(x + 120, y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    // Name
    doc.fontSize(9).font('Helvetica').fillColor('#1a1a1a');
    doc.text(name || '', x, y + 3, { width: 120, align: 'center', lineBreak: false });
    // Label
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text(label, x, y + 15, { width: 120, align: 'center', lineBreak: false });
    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw school seal — subtle, low opacity.
   */
  drawSeal(doc, school, options = {}) {
    const seal = school?.documentSettings?.seal;
    if (!seal?.show) return;

    const margin = options.margin || 40;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const pos = seal.position || 'center';
    const sealSize = 50;
    const x = pos === 'left' ? margin + 20 : pos === 'right' ? pageWidth - margin - sealSize - 20 : (pageWidth - sealSize) / 2;
    const y = options.sealY || (pageHeight - 120);

    if (seal.image) {
      const imgPath = resolveImagePath(seal.image);
      if (imgPath) {
        try {
          doc.save();
          doc.opacity(seal.opacity || 0.15);
          doc.image(imgPath, x, y, { width: sealSize, height: sealSize });
          doc.restore();
          return;
        } catch (e) { /* ignore */ }
      }
    }

    // Fallback: subtle circular seal
    const cx = x + sealSize / 2;
    const cy = y + sealSize / 2;
    const r = sealSize / 2 - 2;
    doc.save();
    doc.opacity(seal.opacity || 0.12);
    doc.circle(cx, cy, r).strokeColor('#bbb').lineWidth(1).stroke();
    doc.circle(cx, cy, r - 4).strokeColor('#ddd').lineWidth(0.5).stroke();
    doc.fontSize(4).font('Helvetica-Bold').fillColor('#bbb');
    const shortName = school?.shortName || school?.name || 'SEAL';
    doc.text(shortName.substring(0, 20), x + 4, cy - 3, { width: sealSize - 8, align: 'center', lineBreak: false });
    doc.restore();
    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw watermark — very subtle.
   */
  drawWatermark(doc, school) {
    const wm = school?.documentSettings?.watermark;
    if (!wm?.enabled || !wm.text) return;

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    doc.save();
    doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.fontSize(42).fillColor('rgba(200,200,200,0.10)');
    doc.text(wm.text, 0, pageHeight / 2 - 20, { align: 'center', width: pageWidth });
    doc.restore();
    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw a QR code placeholder (actual QR generation requires a QR library).
   * For now, draws a placeholder box with verification URL.
   */
  drawQRCode(doc, verificationUrl, x, y, size = 60) {
    if (!verificationUrl) return;

    // Draw a simple QR placeholder box
    doc.rect(x, y, size, size).strokeColor('#000').lineWidth(1).stroke();

    // Simple grid pattern as QR placeholder
    const cellSize = size / 15;
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        // Pseudo-random pattern based on URL hash
        const hash = (verificationUrl.charCodeAt((row * 15 + col) % verificationUrl.length) + row + col) % 3;
        if (hash === 0) {
          doc.rect(x + col * cellSize, y + row * cellSize, cellSize, cellSize).fillColor('#000').fill();
        }
      }
    }

    // Corner markers
    [[0, 0], [12, 0], [0, 12]].forEach(([cx, cy]) => {
      doc.rect(x + cx * cellSize, y + cy * cellSize, 3 * cellSize, 3 * cellSize).fillColor('#fff').fill();
      doc.rect(x + cx * cellSize, y + cy * cellSize, 3 * cellSize, 3 * cellSize).strokeColor('#000').lineWidth(1).stroke();
      doc.rect(x + (cx + 1) * cellSize, y + (cy + 1) * cellSize, cellSize, cellSize).fillColor('#000').fill();
    });

    doc.fillColor('#000');
  }

  /**
   * Draw a modern, minimal table — very light borders, comfortable spacing.
   * No filled header backgrounds. Just bold header text with a thin bottom border.
   * Subtle alternating rows. No outer border.
   */
  drawTable(doc, options) {
    const {
      headers, rows, widths, x = 40, y = doc.y,
      primaryColor = '#1e40af',
      fontSize = 9, headerFontSize = 8,
      aligns, rowHeight = 18, headerHeight = 20,
      repeatHeader = false,
    } = options;

    const tableWidth = widths.reduce((a, b) => a + b, 0);
    let currentY = y;

    const drawHeaderRow = () => {
      // Header: bold, gray, uppercase-style, thin bottom border
      doc.fontSize(headerFontSize).font('Helvetica-Bold').fillColor('#6b7280');
      let cx = x;
      headers.forEach((h, i) => {
        doc.text(String(h).toUpperCase(), cx + 4, currentY + 5, { width: widths[i] - 8, align: aligns?.[i] || 'left' });
        cx += widths[i];
      });
      // Thin bottom border under header
      doc.moveTo(x, currentY + headerHeight - 2).lineTo(x + tableWidth, currentY + headerHeight - 2).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      doc.fillColor('#1a1a1a');
      currentY += headerHeight;
    };

    drawHeaderRow();

    // Draw rows
    doc.fontSize(fontSize).font('Helvetica');
    rows.forEach((row, rowIdx) => {
      // Page break check
      if (currentY + rowHeight > doc.page.height - 80) {
        doc.addPage();
        currentY = 40;
        if (repeatHeader) drawHeaderRow();
      }

      // Very subtle alternating rows
      if (rowIdx % 2 === 0) {
        doc.rect(x, currentY, tableWidth, rowHeight).fillColor('#fafafa').fill();
        doc.fillColor('#1a1a1a');
      }

      let cx = x;
      row.forEach((cell, i) => {
        const text = typeof cell === 'object' && cell !== null ? cell.text : String(cell ?? '');
        const isBold = typeof cell === 'object' && cell !== null && cell.bold;
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(isBold ? '#1a1a1a' : '#374151');
        doc.text(text, cx + 4, currentY + 4, { width: widths[i] - 8, align: aligns?.[i] || 'left' });
        cx += widths[i];
      });

      currentY += rowHeight;
    });

    // Thin bottom border to close table
    doc.moveTo(x, currentY).lineTo(x + tableWidth, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    doc.y = currentY + 8;
    doc.font('Helvetica').fillColor('#1a1a1a');
  }

  /**
   * Draw an info block — clean key-value pairs, no borders, generous spacing.
   */
  drawInfoBlock(doc, items, options = {}) {
    const {
      x = 40, y = doc.y, columns = 2,
      rowHeight = 28, gap = 10,
      contentWidth: customWidth,
    } = options;

    const contentWidth = customWidth || (doc.page.width - x * 2);
    const colWidth = contentWidth / columns;
    let currentY = y;

    items.forEach((item, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const itemX = x + col * colWidth + (col > 0 ? gap / 2 : 0);
      const itemW = colWidth - gap;
      const itemY = currentY + row * rowHeight;

      // Label — gray, small, on top
      doc.fontSize(7).font('Helvetica').fillColor('#9ca3af');
      doc.text(item.label, itemX, itemY, { width: itemW });
      // Value — dark, below label
      doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a');
      doc.text(item.value || '—', itemX, itemY + 10, { width: itemW });
    });

    const rows = Math.ceil(items.length / columns);
    doc.y = currentY + rows * rowHeight + 4;
    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw a document title — centered, bold, clean. No accent color.
   */
  drawTitle(doc, title, options = {}) {
    const {
      align = 'center',
      margin = 40, fontSize = 14,
    } = options;

    const contentWidth = doc.page.width - margin * 2;

    doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(title.toUpperCase(), margin, doc.y + 4, { align, width: contentWidth });
    doc.y = doc.y + 6;
    doc.fillColor('#1a1a1a');
  }

  /**
   * Draw a prominent amount — large bold text with thin top separator.
   * No filled boxes. Just clean typography.
   */
  drawAmountBox(doc, label, amount, options = {}) {
    const {
      x, y = doc.y,
      width = 220, align = 'right',
      margin = 40, height = 30,
      fontSize = 16,
    } = options;

    const boxX = x || (doc.page.width - margin - width);

    // Light top separator only — no border box
    doc.moveTo(boxX, y).lineTo(boxX + width, y).strokeColor('#d1d5db').lineWidth(0.5).stroke();

    // Label — small, gray, left; Amount — large, bold, right; same baseline
    const lineY = y + 5;
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text(label.toUpperCase(), boxX, lineY, { width: width / 2 });
    doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text(amount, boxX, lineY, { width: width, align: 'right' });

    doc.y = y + height;
    doc.font('Helvetica').fillColor('#1a1a1a');
  }

  /**
   * Generate a verification URL for a document.
   */
  getVerificationUrl(school, token) {
    const baseUrl = school?.documentSettings?.verification?.verificationUrl || '';
    if (!baseUrl) return null;
    return `${baseUrl}/${token}`;
  }
}

module.exports = {
  BaseEngine,
  clean,
  formatDate,
  formatCurrency,
  numberToWords,
  getFullAddress,
  getContactLine,
  resolveImagePath,
  generateVerificationToken,
};

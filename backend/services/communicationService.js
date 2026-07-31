const emailProvider = process.env.EMAIL_PROVIDER || 'console';
const smsProvider = process.env.SMS_PROVIDER || 'console';

const CommunicationService = {
  /**
   * Send an email.
   * Supports console, smtp, sendgrid, ses providers via env config.
   */
  async sendEmail({ to, subject, body, html, from = process.env.FROM_EMAIL || 'noreply@edupilot.com' }) {
    if (!to || !subject || !body) throw new Error('to, subject and body are required');

    const payload = { to: Array.isArray(to) ? to : [to], subject, body, html, from };

    if (emailProvider === 'console') {
      console.log('[EMAIL]', JSON.stringify(payload, null, 2));
      return { success: true, provider: 'console', messageId: `email-${Date.now()}` };
    }

    // SMTP / SendGrid / AWS SES integration placeholder
    // e.g. if (emailProvider === 'sendgrid') use @sendgrid/mail
    throw new Error(`Email provider '${emailProvider}' not configured`);
  },

  /**
   * Send an SMS.
   * Supports console, twilio, aws-sns providers via env config.
   */
  async sendSMS({ to, message, from = process.env.SMS_FROM || 'EduPilot' }) {
    if (!to || !message) throw new Error('to and message are required');

    const payload = { to: Array.isArray(to) ? to : [to], message, from };

    if (smsProvider === 'console') {
      console.log('[SMS]', JSON.stringify(payload, null, 2));
      return { success: true, provider: 'console', messageId: `sms-${Date.now()}` };
    }

    // Twilio / AWS SNS integration placeholder
    throw new Error(`SMS provider '${smsProvider}' not configured`);
  },

  /**
   * Send bulk notifications by email and/or SMS.
   */
  async sendBulk({ recipients, subject, body, html, sendEmail = false, sendSMS = false }) {
    const results = [];
    if (sendEmail) {
      const emails = recipients.filter(r => r.email).map(r => r.email);
      if (emails.length) results.push(await this.sendEmail({ to: emails, subject, body, html }));
    }
    if (sendSMS) {
      for (const r of recipients) {
        if (r.phone) results.push(await this.sendSMS({ to: r.phone, message: body }));
      }
    }
    return results;
  },

  generateWhatsAppLink(phone, message) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
};

module.exports = CommunicationService;

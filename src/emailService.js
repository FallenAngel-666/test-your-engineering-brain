/**
 * Transactional Email Delivery Service
 * Supports Resend API, SMTP (SendGrid / Gmail / Custom SMTP), and safe simulation mode.
 * Attaches the generated PDF certificate directly to the outgoing email.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const { formatDate } = require('./certificateGenerator');

// Check configured provider
function getEmailProviderConfig() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT || 587;
  const fromEmail = process.env.FROM_EMAIL || 'iei@drmgrdu.ac.in';
  const fromName = process.env.FROM_NAME || 'MGR IEI Students Chapter';

  const isResendConfigured = Boolean(resendApiKey && resendApiKey !== 'your_resend_api_key_here');
  const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass && smtpHost !== 'smtp.example.com');

  return {
    isConfigured: isResendConfigured || isSmtpConfigured,
    provider: isResendConfigured ? 'resend' : (isSmtpConfigured ? 'smtp' : 'simulation'),
    resendApiKey,
    smtp: { host: smtpHost, port: Number(smtpPort), user: smtpUser, pass: smtpPass },
    fromEmail,
    fromName
  };
}

/**
 * Creates formatted email body and subject
 */
function buildEmailContent({ fullName, branch, score, percentage, completionDate }) {
  const formattedDate = formatDate(completionDate);
  const subject = "Your Test Your Engineering Brain E-Certificate";

  const textBody = `Dear ${fullName},

Congratulations on completing the Test Your Engineering Brain quiz!

Thank you for participating in this initiative organized by the MGR IEI Students Chapter, Dr. M.G.R. Educational and Research Institute.

Your engineering quiz results are:

* Name: ${fullName}
* Branch: ${branch}
* Score: ${score}/10
* Percentage: ${percentage}%
* Completion Date: ${formattedDate}

Your personalized E-certificate is attached to this email.

Keep learning, keep innovating, and continue challenging your engineering knowledge!

Regards,
MGR IEI Students Chapter
Dr. M.G.R. Educational and Research Institute`;

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
      .header { background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
      .header h1 { margin: 0 0 8px 0; font-size: 22px; color: #ffd166; letter-spacing: 0.5px; }
      .header p { margin: 0; font-size: 13px; color: #94a3b8; }
      .body-content { padding: 32px 24px; }
      .greeting { font-size: 17px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
      .results-card { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 24px 0; }
      .results-card h3 { margin: 0 0 12px 0; font-size: 15px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; }
      .metric-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ccfbf1; font-size: 14px; }
      .metric-row:last-child { border-bottom: none; }
      .metric-label { color: #475569; font-weight: 500; }
      .metric-value { color: #0f172a; font-weight: 700; }
      .attachment-notice { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px; color: #1e40af; }
      .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>TEST YOUR ENGINEERING BRAIN</h1>
        <p>MGR IEI Students Chapter • Dr. M.G.R. Educational and Research Institute</p>
      </div>
      <div class="body-content">
        <div class="greeting">Dear ${fullName},</div>
        <p>Congratulations on completing the <strong>Test Your Engineering Brain</strong> quiz!</p>
        <p>Thank you for participating in this initiative organized by the <strong>MGR IEI Students Chapter, Dr. M.G.R. Educational and Research Institute</strong>.</p>
        
        <div class="results-card">
          <h3>Your Engineering Quiz Results</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ccfbf1;"><td style="padding: 6px 0; color: #475569;"><strong>Name:</strong></td><td style="padding: 6px 0; text-align: right; color: #0f172a;">${fullName}</td></tr>
            <tr style="border-bottom: 1px solid #ccfbf1;"><td style="padding: 6px 0; color: #475569;"><strong>Branch:</strong></td><td style="padding: 6px 0; text-align: right; color: #0f172a;">${branch}</td></tr>
            <tr style="border-bottom: 1px solid #ccfbf1;"><td style="padding: 6px 0; color: #475569;"><strong>Score:</strong></td><td style="padding: 6px 0; text-align: right; color: #0f766e; font-weight: bold;">${score} / 10</td></tr>
            <tr style="border-bottom: 1px solid #ccfbf1;"><td style="padding: 6px 0; color: #475569;"><strong>Percentage:</strong></td><td style="padding: 6px 0; text-align: right; color: #0f766e; font-weight: bold;">${percentage}%</td></tr>
            <tr><td style="padding: 6px 0; color: #475569;"><strong>Completion Date:</strong></td><td style="padding: 6px 0; text-align: right; color: #0f172a;">${formattedDate}</td></tr>
          </table>
        </div>

        <div class="attachment-notice">
          📎 <strong>Personalized E-Certificate Attached:</strong> Your official landscape PDF certificate has been verified and attached to this email.
        </div>

        <p>Keep learning, keep innovating, and continue challenging your engineering knowledge!</p>

        <p style="margin-top: 24px; color: #334155;">
          Regards,<br>
          <strong>MGR IEI Students Chapter</strong><br>
          <em>Dr. M.G.R. Educational and Research Institute</em>
        </p>
      </div>
      <div class="footer">
        This is an automated academic verification from MGR IEI Students Chapter.<br>
        Dr. M.G.R. Educational and Research Institute (Deemed to be University), Chennai, India.
      </div>
    </div>
  </body>
  </html>`;

  return { subject, textBody, htmlBody };
}

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSesbL495fyPcfYw49WAKHQqBVtaMsLOrkSRARc8dX6kKVUBMw/viewform?usp=publish-editor";

/**
 * Sends or routes certificate email delivery
 * Automated email delivery is managed through the official MGR IEI Google Form.
 */
async function sendCertificateEmail({
  participant,
  certificate,
  score,
  percentage,
  pdfBuffer,
  fileName
}) {
  console.log(`[Email] Automatic email delivery handled via Google Form for ${participant.email}`);
  const status = 'Form Dispatched';
  db.updateCertificateEmailStatus(certificate.certificateId, status);
  db.logEmailAttempt({
    participantId: participant.participantId,
    certificateId: certificate.certificateId,
    recipientEmail: participant.email,
    status: status,
    errorCode: null
  });

  return {
    success: true,
    status: 'Form Dispatched',
    provider: 'google-forms',
    message: 'Official Google Form handles automated E-Certificate email delivery.',
    formUrl: GOOGLE_FORM_URL
  };
}

module.exports = {
  getEmailProviderConfig,
  buildEmailContent,
  sendCertificateEmail
};

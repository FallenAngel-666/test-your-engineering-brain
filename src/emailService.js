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
  const fromEmail = process.env.FROM_EMAIL || 'mgr.iei.chapter@drmgrdu.ac.in';
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

/**
 * Sends or simulates certificate email delivery
 */
async function sendCertificateEmail({
  participant,
  certificate,
  score,
  percentage,
  pdfBuffer,
  fileName
}) {
  const config = getEmailProviderConfig();
  const { subject, textBody, htmlBody } = buildEmailContent({
    fullName: participant.fullName,
    branch: participant.branch,
    score,
    percentage,
    completionDate: certificate.generatedAt
  });

  const attachment = {
    filename: fileName,
    content: pdfBuffer,
    contentType: 'application/pdf'
  };

  // Case 1: Live SMTP
  if (config.provider === 'smtp') {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      });

      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: participant.email,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: [attachment]
      });

      console.log(`[Email] Successfully delivered via SMTP to ${participant.email}: ${info.messageId}`);
      db.updateCertificateEmailStatus(certificate.certificateId, 'Sent');
      db.logEmailAttempt({
        participantId: participant.participantId,
        certificateId: certificate.certificateId,
        recipientEmail: participant.email,
        status: 'Sent'
      });

      return {
        success: true,
        status: 'Sent',
        provider: 'smtp',
        message: 'Certificate emailed successfully.'
      };
    } catch (err) {
      console.error(`[Email] SMTP delivery failed to ${participant.email}:`, err.message);
      db.updateCertificateEmailStatus(certificate.certificateId, 'Failed');
      db.logEmailAttempt({
        participantId: participant.participantId,
        certificateId: certificate.certificateId,
        recipientEmail: participant.email,
        status: 'Failed',
        errorCode: err.message
      });

      return {
        success: false,
        status: 'Failed',
        provider: 'smtp',
        error: err.message
      };
    }
  }

  // Case 2: Live Resend API
  if (config.provider === 'resend') {
    try {
      const fetch = globalThis.fetch || require('node-fetch');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: [participant.email],
          subject,
          text: textBody,
          html: htmlBody,
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer.toString('base64')
            }
          ]
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Resend API returned error');
      }

      console.log(`[Email] Successfully delivered via Resend to ${participant.email}: ${resData.id}`);
      db.updateCertificateEmailStatus(certificate.certificateId, 'Sent');
      db.logEmailAttempt({
        participantId: participant.participantId,
        certificateId: certificate.certificateId,
        recipientEmail: participant.email,
        status: 'Sent'
      });

      return {
        success: true,
        status: 'Sent',
        provider: 'resend',
        messageId: resData.id
      };
    } catch (err) {
      console.error(`[Email] Resend delivery failed to ${participant.email}:`, err.message);
      db.updateCertificateEmailStatus(certificate.certificateId, 'Failed');
      db.logEmailAttempt({
        participantId: participant.participantId,
        certificateId: certificate.certificateId,
        recipientEmail: participant.email,
        status: 'Failed',
        errorCode: err.message
      });

      return {
        success: false,
        status: 'Failed',
        provider: 'resend',
        error: err.message
      };
    }
  }

  // Case 3: Simulation / Pending Configuration Mode
  // Cleanly handles missing API keys without claiming a fake email was sent!
  console.log(`[Email] Credentials not configured in .env. Recording as Pending Config for ${participant.email}.`);
  const status = 'Pending Config';
  db.updateCertificateEmailStatus(certificate.certificateId, status);
  db.logEmailAttempt({
    participantId: participant.participantId,
    certificateId: certificate.certificateId,
    recipientEmail: participant.email,
    status: 'Pending Config',
    errorCode: 'Email provider credentials not configured. Set RESEND_API_KEY or SMTP credentials in .env.'
  });

  return {
    success: false,
    status: 'Pending Config',
    provider: 'simulation',
    message: 'Email workflow completed. Live dispatch is awaiting RESEND_API_KEY or SMTP settings in .env.',
    simulatedEmail: {
      recipient: participant.email,
      subject,
      body: textBody,
      attachment: fileName
    }
  };
}

module.exports = {
  getEmailProviderConfig,
  buildEmailContent,
  sendCertificateEmail
};

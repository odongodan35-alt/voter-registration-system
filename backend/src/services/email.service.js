import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
  const port = Number(process.env.MAILTRAP_PORT || 2525);
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASSWORD;

  if (!user || !pass) {
    console.warn('[email] MAILTRAP_USER or MAILTRAP_PASSWORD not set — emails will not send.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // Mailtrap on port 2525 uses STARTTLS, not implicit TLS
    auth: { user, pass }
  });

  return transporter;
};

/**
 * Send a password reset email with a link.
 */
export const sendPasswordResetEmail = async ({ to, fullName, resetLink }) => {
  const t = getTransporter();
  if (!t) return { skipped: true, reason: 'email_not_configured' };

  const subject = 'Reset your VRS Kenya password';
  const text = [
    `Hi ${fullName || 'there'},`,
    '',
    'You requested a password reset for your VRS Kenya account.',
    '',
    'Click the link below to set a new password. This link expires in 30 minutes and can only be used once:',
    '',
    resetLink,
    '',
    "If you didn't request this, you can safely ignore this email.",
    '',
    '— VRS Kenya (Demo/Administrative System)'
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e40af; margin: 0 0 16px;">Reset your password</h2>
      <p>Hi ${escapeHtml(fullName || 'there')},</p>
      <p>You requested a password reset for your <strong>VRS Kenya</strong> account.</p>
      <p>Click the button below to set a new password. This link <strong>expires in 30 minutes</strong> and can only be used once.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}"
           style="display: inline-block; background: #1e40af; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="color: #64748b; font-size: 13px;">Or copy this link into your browser:<br/>
        <span style="word-break: break-all;">${escapeHtml(resetLink)}</span>
      </p>
      <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Demo/Administrative System — Not an official election registration platform.</p>
    </div>
  `;

  const info = await t.sendMail({
    from: `"VRS Kenya" <no-reply@vrs-kenya.local>`,
    to,
    subject,
    text,
    html
  });

  return { sent: true, messageId: info.messageId };
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
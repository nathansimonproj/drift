const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// EMAIL_FROM must be an address verified in SendGrid under Settings ->
// Sender Authentication -> Single Sender Verification (no domain required,
// just verifying that you own this one address).
const FROM = process.env.EMAIL_FROM;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/pages/reset-password.html?token=${token}`;

  if (!process.env.SENDGRID_API_KEY || !FROM) {
    console.warn(`[mailer] SENDGRID_API_KEY/EMAIL_FROM not set — reset link for ${email}: ${resetUrl}`);
    return;
  }

  try {
    await sgMail.send({
      to: email,
      from: FROM,
      subject: 'Reset your Drift password',
      html: `
        <p>Someone requested a password reset for your Drift account.</p>
        <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error('[mailer] SendGrid send failed', err.response?.body || err);
  }
}

module.exports = { sendPasswordResetEmail };

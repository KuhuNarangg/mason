const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,          // STARTTLS
    auth: {
      user: process.env.BREVO_SMTP_USER,   // your Brevo account email
      pass: process.env.BREVO_SMTP_KEY,    // Brevo SMTP key (not account password)
    },
  });

/* ── Generic send ──────────────────────────────────── */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    console.warn('[Email] BREVO_SMTP_USER or BREVO_SMTP_KEY not set — skipping email send');
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Mason Store" <${process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
  }
};

/* ── Admin Lockout Alert ───────────────────────────── */
const sendAdminLockoutAlert = async ({ adminEmail, ipAddress, attempts, lockUntil }) => {
  await sendEmail({
    to: adminEmail,
    subject: '🚨 Mason Admin — Suspicious Login Attempt',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px 32px;">
          <h2 style="color:#C08A74;margin:0;font-size:1.2rem;letter-spacing:1px;">MASON ADMIN SECURITY ALERT</h2>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:1rem;color:#0f172a;font-weight:600;">⚠️ Multiple failed admin access code attempts detected</p>
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;color:#374151;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;">Failed Attempts</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">${attempts} attempts</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;">Account Locked Until</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">${new Date(lockUntil).toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">IP Address</td><td style="padding:8px 0;font-weight:600;">${ipAddress || 'Unknown'}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:0.85rem;color:#6b7280;">If this was not you, please change your admin password immediately and contact support.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;font-size:0.75rem;color:#9ca3af;">
          Mason Store — Automated Security Notification
        </div>
      </div>`,
  });
};

/* ── Welcome Email ─────────────────────────────────── */
const sendWelcomeEmail = async ({ name, email }) => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Mason — Your Account is Ready ✨',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px 32px;text-align:center;">
          <h1 style="color:#C08A74;margin:0;font-size:1.8rem;letter-spacing:4px;">MASON</h1>
          <p style="color:#9ca3af;margin:4px 0 0;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;">The Art of Femininity</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <h2 style="color:#0f172a;margin:0 0 12px;">Welcome, ${name}! 🌸</h2>
          <p style="color:#6b7280;line-height:1.7;margin:0 0 24px;">Your Mason account is ready. Explore our curated collections of ethnic, party wear, and contemporary fashion crafted for the modern woman.</p>
          <a href="${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/category/all"
            style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-size:0.85rem;letter-spacing:1.5px;text-transform:uppercase;">
            Start Shopping →
          </a>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;font-size:0.75rem;color:#9ca3af;text-align:center;">
          © ${new Date().getFullYear()} House of Mason. All rights reserved.
        </div>
      </div>`,
  });
};

/* ── Order Confirmation ────────────────────────────── */
const sendOrderConfirmation = async ({ name, email, orderNumber, totalAmount, items }) => {
  const itemRows = (items || []).map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${i.name} (${i.variantSize}/${i.variantColor}) × ${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  await sendEmail({
    to: email,
    subject: `Mason Order Confirmed — #${orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px 32px;text-align:center;">
          <h1 style="color:#C08A74;margin:0;font-size:1.4rem;letter-spacing:3px;">MASON</h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">Order Confirmed ✅</h2>
          <p style="color:#6b7280;margin:0 0 20px;">Hi ${name}, your order <strong>#${orderNumber}</strong> has been confirmed and is being processed.</p>
          <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
          <div style="margin-top:16px;padding-top:16px;border-top:2px solid #0f172a;display:flex;justify-content:space-between;">
            <span style="font-weight:700;color:#0f172a;">Total</span>
            <span style="font-weight:700;color:#C08A74;font-size:1.1rem;">₹${Number(totalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;font-size:0.75rem;color:#9ca3af;text-align:center;">
          © ${new Date().getFullYear()} House of Mason. All rights reserved.
        </div>
      </div>`,
  });
};

module.exports = { sendEmail, sendAdminLockoutAlert, sendWelcomeEmail, sendOrderConfirmation };

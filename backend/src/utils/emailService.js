const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

/* ── Generic send ──────────────────────────────────── */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP_USER or SMTP_PASS not set — skipping email send');
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Owl Stitch by Mason" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    
    // Log success
    try {
      await EmailLog.create({ to, subject, body: html, status: 'sent' });
    } catch (logErr) {
      console.error('[Email Log Error]', logErr);
    }
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    
    // Log failure
    try {
      await EmailLog.create({ to, subject, body: html, status: 'failed', error: err.message });
    } catch (logErr) {
      console.error('[Email Log Error]', logErr);
    }
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

/* ── Order Shipped ─────────────────────────────────── */
const sendOrderShipped = async ({ name, email, orderNumber, trackingUrl }) => {
  await sendEmail({
    to: email,
    subject: `Your Mason Order #${orderNumber} is Shipped! 🚚`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px;text-align:center;">
          <h1 style="color:#C08A74;margin:0;font-size:1.4rem;letter-spacing:3px;">MASON</h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">Great news, ${name}!</h2>
          <p style="color:#6b7280;line-height:1.6;">Your order <strong>#${orderNumber}</strong> has been handed over to our delivery partner and is on its way to you.</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#C08A74;color:#fff;text-decoration:none;border-radius:6px;font-size:0.85rem;font-weight:bold;">Track Order</a>` : ''}
        </div>
      </div>`,
  });
};

/* ── Order Out for Delivery ────────────────────────── */
const sendOrderOutForDelivery = async ({ name, email, orderNumber }) => {
  await sendEmail({
    to: email,
    subject: `Your Mason Order #${orderNumber} is Out for Delivery! 🛵`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="padding:28px 32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">It's arriving today!</h2>
          <p style="color:#6b7280;line-height:1.6;">Hi ${name}, your order <strong>#${orderNumber}</strong> is out for delivery. Please be available to receive your package.</p>
        </div>
      </div>`,
  });
};

/* ── Order Delivered ───────────────────────────────── */
const sendOrderDelivered = async ({ name, email, orderNumber }) => {
  await sendEmail({
    to: email,
    subject: `Your Mason Order #${orderNumber} has been Delivered! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="padding:28px 32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">Order Delivered</h2>
          <p style="color:#6b7280;line-height:1.6;">Hi ${name}, we are delighted to let you know that your order <strong>#${orderNumber}</strong> has been delivered. We hope you love it!</p>
        </div>
      </div>`,
  });
};

/* ── Return Request ────────────────────────────────── */
const sendReturnRequest = async ({ name, email, orderNumber, itemName }) => {
  await sendEmail({
    to: email,
    subject: `Return Request Received — #${orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="padding:28px 32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">Return Request Submitted</h2>
          <p style="color:#6b7280;line-height:1.6;">Hi ${name}, we have received your return request for <strong>${itemName}</strong> from order #${orderNumber}. Our team will review it within 24-48 hours.</p>
        </div>
      </div>`,
  });
};

/* ── Return Approved ───────────────────────────────── */
const sendReturnApproved = async ({ name, email, orderNumber, itemName, refundAmount }) => {
  await sendEmail({
    to: email,
    subject: `Return Approved — #${orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="padding:28px 32px;">
          <h2 style="color:#10b981;margin:0 0 8px;">Return Approved ✅</h2>
          <p style="color:#6b7280;line-height:1.6;">Hi ${name}, your return for <strong>${itemName}</strong> has been approved. A refund of ₹${refundAmount} has been initiated.</p>
        </div>
      </div>`,
  });
};

/* ── Refund Processed ──────────────────────────────── */
const sendRefundProcessed = async ({ name, email, orderNumber, amount }) => {
  await sendEmail({
    to: email,
    subject: `Refund Processed — #${orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="padding:28px 32px;">
          <h2 style="color:#10b981;margin:0 0 8px;">Refund Initiated 💸</h2>
          <p style="color:#6b7280;line-height:1.6;">Hi ${name}, a refund of <strong>₹${amount}</strong> for order #${orderNumber} has been successfully processed to your original payment method. It may take 5-7 business days to reflect in your account.</p>
        </div>
      </div>`,
  });
};

/* ── Vendor Registration Received ──────────────────── */
const sendVendorRegistrationReceived = async ({ name, email, businessName }) => {
  await sendEmail({
    to: email,
    subject: 'Mason — Vendor Application Received',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px 32px;text-align:center;">
          <h1 style="color:#C08A74;margin:0;font-size:1.8rem;letter-spacing:4px;">MASON</h1>
          <p style="color:#9ca3af;margin:4px 0 0;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;">Seller Partner Program</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#0f172a;margin:0 0 12px;">Thanks for applying, ${name}! 🌸</h2>
          <p style="color:#6b7280;line-height:1.7;margin:0 0 12px;">We've received your application to sell as <strong>${businessName}</strong> on Mason.</p>
          <p style="color:#6b7280;line-height:1.7;margin:0;">Our team will review your details and we'll let you know soon. This usually takes 1-2 business days.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;font-size:0.75rem;color:#9ca3af;text-align:center;">
          © ${new Date().getFullYear()} House of Mason. All rights reserved.
        </div>
      </div>`,
  });
};

/* ── Vendor Approved (set password) ────────────────── */
const sendVendorApproved = async ({ name, email, businessName, setupUrl }) => {
  await sendEmail({
    to: email,
    subject: 'Congratulations! Your Mason Vendor Account is Approved 🎉',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px 32px;text-align:center;">
          <h1 style="color:#C08A74;margin:0;font-size:1.8rem;letter-spacing:4px;">MASON</h1>
          <p style="color:#9ca3af;margin:4px 0 0;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;">Seller Partner Program</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <h2 style="color:#0f172a;margin:0 0 12px;">Congratulations, ${name}! 🎉</h2>
          <p style="color:#6b7280;line-height:1.7;margin:0 0 24px;">Your vendor application for <strong>${businessName}</strong> has been approved. Please set your password to activate your account and log in to your vendor panel.</p>
          <a href="${setupUrl}"
            style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-size:0.85rem;letter-spacing:1.5px;text-transform:uppercase;">
            Set Password & Login →
          </a>
          <p style="color:#9ca3af;line-height:1.6;margin:24px 0 0;font-size:0.8rem;">This link will expire in 48 hours. If it expires, you can request a new one from the login page.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;font-size:0.75rem;color:#9ca3af;text-align:center;">
          © ${new Date().getFullYear()} House of Mason. All rights reserved.
        </div>
      </div>`,
  });
};

/* ── Vendor Rejected ────────────────────────────────── */
const sendVendorRejected = async ({ name, email, businessName, reason }) => {
  await sendEmail({
    to: email,
    subject: 'Mason — Update on Your Vendor Application',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;padding:24px 32px;text-align:center;">
          <h1 style="color:#C08A74;margin:0;font-size:1.8rem;letter-spacing:4px;">MASON</h1>
          <p style="color:#9ca3af;margin:4px 0 0;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;">Seller Partner Program</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#0f172a;margin:0 0 12px;">Hi ${name},</h2>
          <p style="color:#6b7280;line-height:1.7;margin:0 0 16px;">Unfortunately, we're unable to approve your vendor application for <strong>${businessName}</strong> at this time.</p>
          <div style="background:#f9fafb;border-left:3px solid #dc2626;padding:12px 16px;border-radius:4px;margin:0 0 16px;">
            <p style="margin:0;color:#374151;font-size:0.9rem;"><strong>Reason:</strong> ${reason}</p>
          </div>
          <p style="color:#6b7280;line-height:1.7;margin:0;">If you believe this was a mistake or would like to address the issue and re-apply, please contact our support team.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;font-size:0.75rem;color:#9ca3af;text-align:center;">
          © ${new Date().getFullYear()} House of Mason. All rights reserved.
        </div>
      </div>`,
  });
};

module.exports = {
  sendEmail, sendAdminLockoutAlert, sendWelcomeEmail, sendOrderConfirmation,
  sendOrderShipped, sendOrderOutForDelivery, sendOrderDelivered,
  sendReturnRequest, sendReturnApproved, sendRefundProcessed,
  sendVendorRegistrationReceived, sendVendorApproved, sendVendorRejected,
};

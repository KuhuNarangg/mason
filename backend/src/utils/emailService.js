const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

/* All admin alert / notification emails go to these addresses */
const adminTo = () =>
  (process.env.ADMIN_NOTIFY_EMAILS || 'Contact@owlstitch.com')
    .split(',')
    .map(e => e.trim())
    .join(', ');

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
    try {
      await EmailLog.create({ to, subject, body: html, status: 'sent' });
    } catch (logErr) {
      console.error('[Email Log Error]', logErr);
    }
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    try {
      await EmailLog.create({ to, subject, body: html, status: 'failed', error: err.message });
    } catch (logErr) {
      console.error('[Email Log Error]', logErr);
    }
  }
};

/* ── Shared style helpers ──────────────────────────── */
const header = (label = 'MASON') => `
  <div style="background:#0f172a;padding:20px 32px;text-align:center;">
    <h1 style="color:#C08A74;margin:0;font-size:1.4rem;letter-spacing:3px;">${label}</h1>
  </div>`;

const footer = () => `
  <div style="background:#f9fafb;padding:14px 32px;font-size:0.73rem;color:#9ca3af;text-align:center;">
    © ${new Date().getFullYear()} House of Mason · Automated Notification
  </div>`;

const wrap = (inner) => `
  <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    ${header()}
    <div style="padding:28px 32px;">${inner}</div>
    ${footer()}
  </div>`;

const adminWrap = (inner) => `
  <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f172a;padding:20px 32px;">
      <h1 style="color:#C08A74;margin:0;font-size:1rem;letter-spacing:2px;text-transform:uppercase;">MASON · Admin Notification</h1>
    </div>
    <div style="padding:28px 32px;">${inner}</div>
    ${footer()}
  </div>`;

const row = (label, value) =>
  `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.85rem;width:40%;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:0.85rem;">${value}</td>
  </tr>`;

/* ── Account Lockout Alert ───────────────────────────── */
const sendAccountLockoutAlert = async ({ accountEmail, role, ipAddress, attempts, lockUntil }) => {
  await sendEmail({
    to: adminTo(),
    subject: `🚨 Mason — Suspicious Login Attempt (${role} Account Locked)`,
    html: adminWrap(`
      <p style="margin:0 0 16px;font-size:1rem;color:#dc2626;font-weight:700;">⚠️ ${attempts} failed login attempts detected</p>
      <p style="margin:0 0 18px;color:#374151;font-size:0.88rem;">Someone has attempted to log in to a <strong>${role}</strong> account with incorrect credentials <strong>${attempts} times</strong>. The account has been temporarily locked for security.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row('Account', accountEmail)}
        ${row('Role', role)}
        ${row('IP Address', ipAddress || 'Unknown')}
        ${row('Locked Until', new Date(lockUntil).toLocaleString('en-IN'))}
      </table>
      <p style="margin:20px 0 0;font-size:0.82rem;color:#6b7280;">This is an automated security alert sent to the official Owl Stitch admin team.</p>`),
  });
};

/* ── Admin New Order Alert ─────────────────────────── */
const sendAdminNewOrder = async ({ orderNumber, customerName, customerEmail, totalAmount, paymentMethod, items }) => {
  const itemRows = (items || []).map(i =>
    `<tr>
      <td style="padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:0.83rem;color:#374151;">${i.name} (${i.variantSize}/${i.variantColor}) × ${i.quantity}</td>
      <td style="padding:7px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;font-size:0.83rem;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  await sendEmail({
    to: adminTo(),
    subject: `🛍️ New Order Received — #${orderNumber}`,
    html: adminWrap(`
      <p style="margin:0 0 18px;font-size:1rem;color:#0f172a;font-weight:700;">New order placed on Mason</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        ${row('Order #', orderNumber)}
        ${row('Customer', `${customerName} &lt;${customerEmail}&gt;`)}
        ${row('Payment', paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Prepaid)')}
        ${row('Total', `₹${Number(totalAmount).toLocaleString('en-IN')}`)}
      </table>
      <p style="margin:0 0 10px;font-size:0.85rem;font-weight:600;color:#0f172a;">Items Ordered</p>
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
      <div style="margin-top:20px;padding:12px 16px;background:#f0fdf4;border-radius:6px;border-left:3px solid #16a34a;">
        <p style="margin:0;font-size:0.83rem;color:#166534;">Go to the admin panel → Orders to process this order.</p>
      </div>`),
  });
};

/* ── Admin Return Request Alert ────────────────────── */
const sendAdminReturnRequest = async ({ orderNumber, customerName, customerEmail, itemName, reason }) => {
  await sendEmail({
    to: adminTo(),
    subject: `↩️ Return Requested — Order #${orderNumber}`,
    html: adminWrap(`
      <p style="margin:0 0 18px;font-size:1rem;color:#0f172a;font-weight:700;">A customer has requested a return</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        ${row('Order #', orderNumber)}
        ${row('Customer', `${customerName} &lt;${customerEmail}&gt;`)}
        ${row('Item', itemName)}
        ${row('Reason', reason || 'Not specified')}
      </table>
      <div style="margin-top:4px;padding:12px 16px;background:#fff7ed;border-radius:6px;border-left:3px solid #ea580c;">
        <p style="margin:0;font-size:0.83rem;color:#9a3412;">Go to admin panel → Orders → #${orderNumber} to approve or reject this return.</p>
      </div>`),
  });
};

/* ── Admin Cancellation Request Alert ──────────────── */
const sendAdminCancellationRequest = async ({ orderNumber, customerName, customerEmail, reason }) => {
  await sendEmail({
    to: adminTo(),
    subject: `❌ Cancellation Requested — Order #${orderNumber}`,
    html: adminWrap(`
      <p style="margin:0 0 18px;font-size:1rem;color:#0f172a;font-weight:700;">A customer has requested order cancellation</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        ${row('Order #', orderNumber)}
        ${row('Customer', `${customerName} &lt;${customerEmail}&gt;`)}
        ${row('Reason', reason || 'Not specified')}
      </table>
      <div style="margin-top:4px;padding:12px 16px;background:#fef2f2;border-radius:6px;border-left:3px solid #dc2626;">
        <p style="margin:0;font-size:0.83rem;color:#991b1b;">Go to admin panel → Orders → #${orderNumber} to approve or reject this cancellation.</p>
      </div>`),
  });
};

/* ── Welcome Email ─────────────────────────────────── */
const sendWelcomeEmail = async ({ name, email }) => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Mason — Your Account is Ready ✨',
    html: wrap(`
      <div style="text-align:center;">
        <h2 style="color:#0f172a;margin:0 0 12px;">Welcome, ${name}! 🌸</h2>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 24px;">Your Mason account is ready. Explore our curated collections of ethnic, party wear, and contemporary fashion crafted for the modern woman.</p>
        <a href="${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/category/all"
          style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-size:0.85rem;letter-spacing:1.5px;text-transform:uppercase;">
          Start Shopping →
        </a>
      </div>`),
  });
};

/* ── Order Confirmation (Customer) ─────────────────── */
const sendOrderConfirmation = async ({ name, email, orderNumber, totalAmount, items }) => {
  const itemRows = (items || []).map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:0.85rem;">${i.name} (${i.variantSize}/${i.variantColor}) × ${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;font-size:0.85rem;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  await sendEmail({
    to: email,
    subject: `Mason Order Confirmed — #${orderNumber}`,
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 8px;">Order Confirmed ✅</h2>
      <p style="color:#6b7280;margin:0 0 20px;">Hi ${name}, your order <strong>#${orderNumber}</strong> has been confirmed and is being processed. You can track your order status from your account.</p>
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
      <div style="margin-top:16px;padding-top:14px;border-top:2px solid #0f172a;display:flex;justify-content:space-between;">
        <span style="font-weight:700;color:#0f172a;">Total</span>
        <span style="font-weight:700;color:#C08A74;font-size:1.05rem;">₹${Number(totalAmount).toLocaleString('en-IN')}</span>
      </div>
      <p style="margin:18px 0 0;font-size:0.82rem;color:#9ca3af;">You will receive shipping updates by email as your order progresses.</p>`),
  });
};

/* ── Order Shipped ─────────────────────────────────── */
const sendOrderShipped = async ({ name, email, orderNumber, trackingUrl }) => {
  await sendEmail({
    to: email,
    subject: `Your Mason Order #${orderNumber} is Shipped! 🚚`,
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 8px;">Great news, ${name}!</h2>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 18px;">Your order <strong>#${orderNumber}</strong> has been handed over to our delivery partner and is on its way to you.</p>
      ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;padding:12px 28px;background:#C08A74;color:#fff;text-decoration:none;border-radius:6px;font-size:0.85rem;font-weight:bold;">Track Your Order</a>` : ''}`),
  });
};

/* ── Order Out for Delivery ────────────────────────── */
const sendOrderOutForDelivery = async ({ name, email, orderNumber }) => {
  await sendEmail({
    to: email,
    subject: `Your Mason Order #${orderNumber} is Out for Delivery! 🛵`,
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 8px;">Arriving today!</h2>
      <p style="color:#6b7280;line-height:1.6;">Hi ${name}, your order <strong>#${orderNumber}</strong> is out for delivery. Please be available to receive your package.</p>`),
  });
};

/* ── Order Delivered ───────────────────────────────── */
const sendOrderDelivered = async ({ name, email, orderNumber }) => {
  await sendEmail({
    to: email,
    subject: `Your Mason Order #${orderNumber} has been Delivered! 🎉`,
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 8px;">Order Delivered</h2>
      <p style="color:#6b7280;line-height:1.6;">Hi ${name}, we are delighted to let you know that your order <strong>#${orderNumber}</strong> has been delivered. We hope you love it!</p>`),
  });
};

/* ── Return Request (Customer) ─────────────────────── */
const sendReturnRequest = async ({ name, email, orderNumber, itemName }) => {
  await sendEmail({
    to: email,
    subject: `Return Request Received — #${orderNumber}`,
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 8px;">Return Request Submitted</h2>
      <p style="color:#6b7280;line-height:1.6;">Hi ${name}, we have received your return request for <strong>${itemName}</strong> from order <strong>#${orderNumber}</strong>. Our team will review it within 24–48 hours and update you by email.</p>`),
  });
};

/* ── Return Approved (Customer) ────────────────────── */
const sendReturnApproved = async ({ name, email, orderNumber, itemName, refundAmount }) => {
  await sendEmail({
    to: email,
    subject: `Return Approved — #${orderNumber}`,
    html: wrap(`
      <h2 style="color:#10b981;margin:0 0 8px;">Return Approved ✅</h2>
      <p style="color:#6b7280;line-height:1.6;">Hi ${name}, your return for <strong>${itemName}</strong> (order #${orderNumber}) has been approved. A refund of <strong>₹${refundAmount}</strong> has been initiated.</p>`),
  });
};

/* ── Refund Processed (Customer) ───────────────────── */
const sendRefundProcessed = async ({ name, email, orderNumber, amount }) => {
  await sendEmail({
    to: email,
    subject: `Refund Processed — #${orderNumber}`,
    html: wrap(`
      <h2 style="color:#10b981;margin:0 0 8px;">Refund Initiated 💸</h2>
      <p style="color:#6b7280;line-height:1.6;">Hi ${name}, a refund of <strong>₹${amount}</strong> for order <strong>#${orderNumber}</strong> has been successfully processed to your original payment method. It may take 5–7 business days to reflect in your account.</p>`),
  });
};

/* ── Vendor Registration Received ──────────────────── */
const sendVendorRegistrationReceived = async ({ name, email, businessName }) => {
  await sendEmail({
    to: email,
    subject: 'Mason — Vendor Application Received',
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 12px;">Thanks for applying, ${name}! 🌸</h2>
      <p style="color:#6b7280;line-height:1.7;margin:0 0 12px;">We've received your application to sell as <strong>${businessName}</strong> on Mason.</p>
      <p style="color:#6b7280;line-height:1.7;margin:0;">Our team will review your details and we'll let you know soon. This usually takes 1–2 business days.</p>`),
  });
};

/* ── Vendor Approved ────────────────────────────────── */
const sendVendorApproved = async ({ name, email, businessName, setupUrl }) => {
  await sendEmail({
    to: email,
    subject: 'Congratulations! Your Mason Vendor Account is Approved 🎉',
    html: wrap(`
      <div style="text-align:center;">
        <h2 style="color:#0f172a;margin:0 0 12px;">Congratulations, ${name}! 🎉</h2>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 24px;">Your vendor application for <strong>${businessName}</strong> has been approved. Please set your password to activate your account.</p>
        <a href="${setupUrl}" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-size:0.85rem;letter-spacing:1.5px;text-transform:uppercase;">Set Password &amp; Login →</a>
        <p style="color:#9ca3af;margin:24px 0 0;font-size:0.8rem;">This link expires in 48 hours.</p>
      </div>`),
  });
};

/* ── Vendor Rejected ────────────────────────────────── */
const sendVendorRejected = async ({ name, email, businessName, reason }) => {
  await sendEmail({
    to: email,
    subject: 'Mason — Update on Your Vendor Application',
    html: wrap(`
      <h2 style="color:#0f172a;margin:0 0 12px;">Hi ${name},</h2>
      <p style="color:#6b7280;line-height:1.7;margin:0 0 16px;">Unfortunately, we're unable to approve your vendor application for <strong>${businessName}</strong> at this time.</p>
      <div style="background:#f9fafb;border-left:3px solid #dc2626;padding:12px 16px;border-radius:4px;margin:0 0 16px;">
        <p style="margin:0;color:#374151;font-size:0.9rem;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="color:#6b7280;line-height:1.7;margin:0;">If you believe this was a mistake, please contact our support team.</p>`),
  });
};

module.exports = {
  sendEmail,
  sendAccountLockoutAlert,
  sendAdminNewOrder,
  sendAdminReturnRequest,
  sendAdminCancellationRequest,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderOutForDelivery,
  sendOrderDelivered,
  sendReturnRequest,
  sendReturnApproved,
  sendRefundProcessed,
  sendVendorRegistrationReceived,
  sendVendorApproved,
  sendVendorRejected,
};

const RestockNotification = require('../models/RestockNotification');
const Product = require('../models/Product');
const { sendEmail } = require('./emailService');

const emailWrap = (inner) => `
  <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0f172a;padding:20px 32px;text-align:center;">
      <h1 style="color:#C08A74;margin:0;font-size:1.4rem;letter-spacing:3px;">OWL STITCH</h1>
    </div>
    <div style="padding:28px 32px;">${inner}</div>
    <div style="background:#f9fafb;padding:14px 32px;font-size:0.73rem;color:#9ca3af;text-align:center;">
      © ${new Date().getFullYear()} House of Mason · Automated Notification
    </div>
  </div>`;

const checkAndNotifyRestocks = async (productId, oldVariants = [], newVariants = []) => {
  try {
    const product = await Product.findById(productId).lean();
    if (!product) return;

    const oldVariantsMap = new Map();
    oldVariants.forEach(v => {
      if (v._id) oldVariantsMap.set(v._id.toString(), v);
    });

    for (const newVar of newVariants) {
      if (!newVar._id) continue;
      const variantIdStr = newVar._id.toString();
      const oldVar = oldVariantsMap.get(variantIdStr);

      const oldStock = oldVar ? oldVar.stock : 0;
      const newStock = newVar.stock || 0;

      // Case 1: Stock drops to 0 (or stays 0) -> Reset isNotified to false so they can get alerts next time it's restocked
      if (newStock === 0) {
        await RestockNotification.updateMany(
          { product: productId, variantId: newVar._id, isNotified: true },
          { isNotified: false, notifiedAt: null }
        );
      }

      // Case 2: Stock was 0 and now is > 0 -> Send restock alerts
      if (oldStock === 0 && newStock > 0) {
        const subs = await RestockNotification.find({
          product: productId,
          variantId: newVar._id,
          isNotified: false
        });

        if (subs.length === 0) continue;

        const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${product.slug}`;

        for (const sub of subs) {
          try {
            const htmlContent = emailWrap(`
              <h2 style="color:#0f172a;margin:0 0 12px;">Good news!</h2>
              <p style="color:#6b7280;line-height:1.7;margin:0 0 16px;">The item you wanted is back in stock.</p>
              <div style="background:#f9fafb;border-left:3px solid #C08A74;padding:12px 16px;border-radius:4px;margin:0 0 16px;">
                <p style="margin:0 0 4px;color:#374151;font-size:0.9rem;"><strong>Product:</strong> ${product.name}</p>
                <p style="margin:0 0 4px;color:#374151;font-size:0.9rem;"><strong>Size:</strong> ${sub.size || newVar.size}</p>
                ${sub.color || newVar.color ? `<p style="margin:0;color:#374151;font-size:0.9rem;"><strong>Color:</strong> ${sub.color || newVar.color}</p>` : ''}
              </div>
              <div style="text-align:center;margin:24px 0 12px;">
                <a href="${productUrl}" style="background:#0f172a;color:#C08A74;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:600;display:inline-block;">Shop Now</a>
              </div>
            `);

            await sendEmail({
              to: sub.email,
              subject: `🎉 Good News: "${product.name}" is Back in Stock!`,
              html: htmlContent
            });

            // Mark subscription as notified only on success
            sub.isNotified = true;
            sub.notifiedAt = new Date();
            await sub.save();
          } catch (sendErr) {
            console.error(`[Restock Alert Error] Failed to send email to ${sub.email}:`, sendErr);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Restock Alert Error] Error in checkAndNotifyRestocks:', err);
  }
};

module.exports = { checkAndNotifyRestocks };

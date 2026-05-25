import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatPrice } from './formatPrice';

export const generateInvoicePDF = async (order) => {
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.fontSize = '12px';
  element.style.color = '#333';
  element.style.width = '210mm';
  element.style.backgroundColor = 'white';

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  element.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28px; color: #000;">CLOTHING WEB</h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">Your Fashion Destination</p>
      </div>

      <!-- Invoice Title & Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0 0 10px 0; font-size: 18px;">INVOICE</h2>
          <p style="margin: 5px 0; font-size: 11px;"><strong>Order #:</strong> ${order.orderNumber || order._id.substring(0, 8).toUpperCase()}</p>
          <p style="margin: 5px 0; font-size: 11px;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0; font-size: 11px;"><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 5px 0; font-size: 11px;"><strong>Payment Status:</strong></p>
          <p style="margin: 5px 0; font-size: 12px; color: ${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'}; font-weight: bold;">
            ${order.paymentStatus === 'paid' ? '✓ PAID' : '⏳ PENDING'}
          </p>
        </div>
      </div>

      <!-- Customer & Shipping Info -->
      <div style="display: flex; gap: 30px; margin-bottom: 20px;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold;">BILL TO:</h3>
          <p style="margin: 3px 0; font-size: 11px;"><strong>${order.shippingAddress.fullName}</strong></p>
          <p style="margin: 3px 0; font-size: 11px;">${order.shippingAddress.line1}</p>
          <p style="margin: 3px 0; font-size: 11px;">${order.shippingAddress.line2}</p>
          <p style="margin: 3px 0; font-size: 11px;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}</p>
          <p style="margin: 3px 0; font-size: 11px;">📞 ${order.shippingAddress.phone}</p>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 2px solid #000;">
            <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: bold;">Product</th>
            <th style="padding: 8px; text-align: center; font-size: 11px; font-weight: bold;">Size/Color</th>
            <th style="padding: 8px; text-align: center; font-size: 11px; font-weight: bold;">Qty</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: bold;">Price</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: bold;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item, idx) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-size: 11px;">${item.name}</td>
              <td style="padding: 8px; text-align: center; font-size: 11px;">${item.variantSize} / ${item.variantColor}</td>
              <td style="padding: 8px; text-align: center; font-size: 11px;">${item.quantity}</td>
              <td style="padding: 8px; text-align: right; font-size: 11px;">${formatPrice(item.price)}</td>
              <td style="padding: 8px; text-align: right; font-size: 11px;">${formatPrice(item.price * item.quantity)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Price Summary -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
            <span>Subtotal:</span>
            <span>${formatPrice(order.subtotal)}</span>
          </div>
          ${
            order.discount > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #10b981;">
              <span>Discount:</span>
              <span>-${formatPrice(order.discount)}</span>
            </div>
          `
              : ''
          }
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
            <span>Shipping:</span>
            <span>${order.shippingCharge === 0 ? 'FREE' : formatPrice(order.shippingCharge)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 12px;">
            <span>TOTAL:</span>
            <span>${formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #666;">
        <p style="margin: 5px 0;">Thank you for your purchase!</p>
        <p style="margin: 5px 0;">For any queries, contact us at support@clothingweb.com</p>
        <p style="margin: 5px 0; font-style: italic;">This is a system-generated invoice</p>
      </div>
    </div>
  `;

  try {
    // Add element to body temporarily for html2canvas
    document.body.appendChild(element);

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove element from DOM
    document.body.removeChild(element);

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add multiple pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download PDF
    const fileName = `Invoice_${order.orderNumber || order._id.substring(0, 8)}_${new Date().getTime()}.pdf`;
    pdf.save(fileName);

    return { success: true, message: 'Invoice downloaded successfully' };
  } catch (error) {
    document.body.removeChild(element);
    throw new Error('Failed to generate invoice: ' + error.message);
  }
};

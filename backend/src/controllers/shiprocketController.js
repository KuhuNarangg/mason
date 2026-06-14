const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const shiprocketService = require('../utils/shiprocketService');

// @desc    Vendor generates shipment in Shiprocket & assigns courier AWB
// @route   POST /api/v1/shiprocket/create/:orderId
// @access  Private (Vendor/Admin)
const generateShipmentForOrder = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) {
    res.status(400);
    throw new Error('itemId is required in request body');
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error('Order item not found');
  }

  // RBAC: Verify if the user owns this vendor item or is admin
  const isVendor = item.vendor && item.vendor.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isVendor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorised to ship this item');
  }

  if (item.shiprocketShipmentId) {
    res.status(400);
    throw new Error('Shipment already created for this item');
  }

  // Retrieve vendor info for pickup address
  const vendor = await User.findById(item.vendor);
  const p = vendor?.vendorProfile || {};

  const pickupLocation = p.businessName || 'Primary Hub';

  // Build Shiprocket payload
  const shipmentPayload = {
    order_id: `${order.orderNumber}_${item._id}`,
    order_date: order.createdAt,
    pickup_location: pickupLocation,
    billing_customer_name: order.shippingAddress.fullName || 'Customer',
    billing_address: order.shippingAddress.line1 || 'Address Line 1',
    billing_address_2: order.shippingAddress.line2 || '',
    billing_city: order.shippingAddress.city || 'City',
    billing_pincode: order.shippingAddress.pincode || '000000',
    billing_state: order.shippingAddress.state || 'State',
    billing_country: 'India',
    billing_email: req.user.email || 'customer@mason.com',
    billing_phone: order.shippingAddress.phone || '9999999999',
    shipping_is_billing: true,
    order_items: [
      {
        name: item.name,
        sku: `SKU_${item._id.toString().substring(18)}`,
        units: item.quantity,
        selling_price: item.price,
      }
    ],
    payment_method: 'Prepaid',
    sub_total: item.price * item.quantity,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5
  };

  // 1. Create order in Shiprocket
  const shiprocketOrder = await shiprocketService.createShipment(shipmentPayload);
  
  item.shiprocketOrderId = shiprocketOrder.order_id;
  item.shiprocketShipmentId = shiprocketOrder.shipment_id;

  // 2. Generate AWB and assign Courier
  const awbResult = await shiprocketService.generateAWB(shiprocketOrder.shipment_id);
  const awbCode = awbResult?.response?.data?.awb_code;
  const courierName = awbResult?.response?.data?.courier_name || 'Delhivery';

  if (awbCode) {
    item.trackingNumber = awbCode;
    item.shippingCarrier = courierName;
    item.shippingStatus = 'Packed';
    item.itemStatus = 'packed';
    item.itemStatusHistory.push({
      status: 'packed',
      note: `Shipment generated via Shiprocket. Courier: ${courierName}. AWB: ${awbCode}`
    });
  }

  await order.save();

  // Notify customer
  await createNotification({
    user: order.user,
    title: 'Order Packed & Courier Assigned 📦',
    message: `Your item "${item.name}" has been packed. Courier "${courierName}" assigned. Tracking Code: ${awbCode || 'Pending'}`,
    link: '/profile/orders',
    type: 'order'
  });

  res.json({ success: true, message: 'Shipment created and courier assigned', item });
});

// @desc    Get shipping label URL from Shiprocket
// @route   GET /api/v1/shiprocket/label/:shipmentId
// @access  Private (Vendor/Admin)
const printShipmentLabel = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;

  const labelResult = await shiprocketService.generateLabel(shipmentId);
  const labelUrl = labelResult.label_url || labelResult.label_pdf_url;

  if (!labelUrl) {
    res.status(400);
    throw new Error('Failed to generate shipping label from Shiprocket');
  }

  res.json({ success: true, labelUrl });
});

// @desc    Track shipment checkpoints via AWB tracking
// @route   GET /api/v1/shiprocket/track/:orderId
// @access  Private (Customer/Vendor/Admin)
const trackShipment = asyncHandler(async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) {
    res.status(400);
    throw new Error('itemId query parameter is required');
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error('Order item not found');
  }

  // RBAC checks
  const isCustomer = order.user.toString() === req.user._id.toString();
  const isVendor = item.vendor && item.vendor.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isVendor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorised to track this shipment');
  }

  if (!item.trackingNumber) {
    res.status(400);
    throw new Error('No tracking AWB assigned to this item yet');
  }

  const trackingResult = await shiprocketService.trackAWB(item.trackingNumber);
  res.json({ success: true, tracking: trackingResult.tracking_data });
});

// @desc    Vendor initiates reverse return pickup in Shiprocket
// @route   POST /api/v1/shiprocket/return/:orderId
// @access  Private (Vendor/Admin)
const requestReturnShipment = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) {
    res.status(400);
    throw new Error('itemId is required in request body');
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error('Order item not found');
  }

  if (item.returnStatus !== 'approved') {
    res.status(400);
    throw new Error('Return must be approved by vendor before initiating shipment');
  }

  if (item.returnTrackingNumber) {
    res.status(400);
    throw new Error('Return shipment already created');
  }

  const vendor = await User.findById(item.vendor);
  const p = vendor?.vendorProfile || {};

  const pickupLocation = p.businessName || 'Primary Hub';

  // Build reverse shipping payload
  const returnPayload = {
    order_id: `RET_${order.orderNumber}_${item._id}`,
    order_date: new Date(),
    pickup_customer_name: order.shippingAddress.fullName || 'Customer',
    pickup_address: order.shippingAddress.line1 || 'Address Line 1',
    pickup_city: order.shippingAddress.city || 'City',
    pickup_state: order.shippingAddress.state || 'State',
    pickup_pincode: order.shippingAddress.pincode || '000000',
    pickup_phone: order.shippingAddress.phone || '9999999999',
    shipping_customer_name: p.businessName || vendor.name,
    shipping_address: p.address?.line1 || 'Vendor Address',
    shipping_city: p.address?.city || 'Vendor City',
    shipping_state: p.address?.state || 'Vendor State',
    shipping_pincode: p.address?.pincode || '000000',
    shipping_phone: vendor.phone || '9999999999',
    order_items: [
      {
        name: item.name,
        sku: `SKU_${item._id.toString().substring(18)}`,
        units: item.quantity,
        selling_price: item.price
      }
    ],
    payment_method: 'Prepaid',
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5
  };

  const returnResult = await shiprocketService.createReturnShipment(returnPayload);
  
  item.returnTrackingNumber = returnResult.awb_code;
  item.returnShipmentId = returnResult.shipment_id;
  await order.save();

  // Notify customer
  await createNotification({
    user: order.user,
    title: 'Return Pickup Generated 🔄',
    message: `Reverse pickup generated for return of "${item.name}". AWB: ${returnResult.awb_code}. Courier will pick up shortly.`,
    link: '/profile/orders',
    type: 'order'
  });

  res.json({ success: true, message: 'Reverse return shipment created successfully', item });
});

// @desc    Receive Shiprocket Webhook live status updates
// @route   POST /api/v1/shiprocket/webhook
// @access  Public
const receiveShiprocketWebhook = asyncHandler(async (req, res) => {
  const { awb, status, current_status } = req.body;

  if (!awb) {
    res.status(400);
    throw new Error('AWB code is missing in webhook payload');
  }

  const shippingStatus = status || current_status || 'In Transit';

  // Find order that contains an item matching this AWB tracking number
  const order = await Order.findOne({
    $or: [
      { 'items.trackingNumber': awb },
      { 'items.returnTrackingNumber': awb }
    ]
  });

  if (!order) {
    console.log(`[Shiprocket Webhook] No order found with AWB: ${awb}`);
    return res.status(404).json({ success: false, message: 'AWB not found' });
  }

  // Find the exact item
  const item = order.items.find(i => i.trackingNumber === awb || i.returnTrackingNumber === awb);
  const isReturn = item.returnTrackingNumber === awb;

  item.shippingStatus = shippingStatus;

  // Status mapping
  const normalized = shippingStatus.toLowerCase();
  
  if (!isReturn) {
    if (normalized.includes('shipped') || normalized.includes('in transit')) {
      item.itemStatus = 'shipped';
      if (!item.itemStatusHistory.some(h => h.status === 'shipped')) {
        item.itemStatusHistory.push({ status: 'shipped', note: `Shiprocket Status: ${shippingStatus}` });
      }
    } else if (normalized.includes('delivered')) {
      item.itemStatus = 'delivered';
      if (!item.itemStatusHistory.some(h => h.status === 'delivered')) {
        item.itemStatusHistory.push({ status: 'delivered', note: `Shiprocket Status: ${shippingStatus}` });
      }
    }

    // If all items in this order are delivered, set order status to delivered
    const allDelivered = order.items.every(i => i.itemStatus === 'delivered');
    if (allDelivered) {
      order.status = 'delivered';
      order.statusHistory.push({ status: 'delivered', note: 'All items marked as delivered via Shiprocket' });
    }
  } else {
    // Handling return logistics
    if (normalized.includes('delivered')) {
      item.returnStatus = 'completed'; // item returned to vendor
      
      // Auto Refund logic if approved and delivered back
      item.payoutStatus = 'pending'; // hold payout
    }
  }

  await order.save();

  // Notify customer
  await createNotification({
    user: order.user,
    title: isReturn ? 'Return Update 🔄' : 'Shipping Update 🚚',
    message: `Your package (AWB: ${awb}) status updated to: ${shippingStatus}`,
    link: '/profile/orders',
    type: 'order'
  });

  res.json({ success: true, message: 'Webhook processed successfully' });
});

module.exports = {
  generateShipmentForOrder,
  printShipmentLabel,
  trackShipment,
  requestReturnShipment,
  receiveShiprocketWebhook
};

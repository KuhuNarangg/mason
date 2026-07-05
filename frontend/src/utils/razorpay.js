/**
 * Dynamically loads the Razorpay checkout script.
 * Returns a Promise that resolves when the script is ready.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Opens the Razorpay payment modal.
 *
 * @param {object} options
 * @param {string} options.keyId           - Razorpay key_id from backend
 * @param {string} options.razorpayOrderId - rzp order ID from backend
 * @param {number} options.amount          - Amount in paise
 * @param {string} options.currency        - 'INR'
 * @param {string} options.orderNumber     - Human-readable order number
 * @param {object} options.user            - { name, email, phone }
 * @param {function} options.onSuccess     - Called with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * @param {function} options.onFailure     - Called with error message string
 * @param {function} options.onDismiss     - Called when modal is closed without payment
 */
export const openRazorpayCheckout = (options) => {
  const {
    keyId,
    razorpayOrderId,
    amount,
    currency = 'INR',
    orderNumber,
    user = {},
    onSuccess,
    onFailure,
    onDismiss,
  } = options;

  const rzpOptions = {
    key: keyId,
    amount,
    currency,
    name: 'Mason',
    description: `Order #${orderNumber}`,
    image: '/owlnewnobg.png',          // shown in Razorpay modal header (optional)
    order_id: razorpayOrderId,

    prefill: {
      name: user.name || '',
      email: user.email || '',
      contact: user.phone || '',
    },

    theme: {
      color: '#C08A74',          // rose-gold brand color
    },

    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
    },

    handler: (response) => {
      // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      if (onSuccess) onSuccess(response);
    },
  };

  const rzp = new window.Razorpay(rzpOptions);

  rzp.on('payment.failed', (response) => {
    const msg = response.error?.description || 'Payment failed. Please try again.';
    if (onFailure) onFailure(msg);
  });

  rzp.open();
};

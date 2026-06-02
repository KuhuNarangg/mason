import './PolicyPage.css';

const TandC = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Terms & Conditions</h1>
        <div className="policy-content">
          <p>Welcome to Owl Stitch by Mason. By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement.</p>
          
          <h3>1. Orders & Pricing</h3>
          <p>All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason. Prices are subject to change without notice.</p>
          
          <h3>2. Payments</h3>
          <p>We accept secure payments through our payment gateway. Full payment is required before an order is processed and shipped.</p>

          <h3>3. Shipping</h3>
          <p>We aim to dispatch all orders within the specified timeline. However, delays may occur due to unforeseen circumstances. Shipping charges are calculated at checkout.</p>
          
          <h3>4. Returns & Exchanges</h3>
          <p>Returns are accepted according to the return policy. If you are not satisfied with your purchase, you may initiate a return within the eligible timeframe, provided the item is unworn, unwashed, and retains all original tags.</p>

          <h3>5. Refunds</h3>
          <p>Returned items must pass our quality inspection before refund approval. <strong>Shipping charges are non-refundable and will be deducted from the refund amount.</strong> Refund processing may take up to 10 business days after the returned item is approved. Approved refunds will be credited back to your original payment method.</p>

          <h3>6. User Responsibilities</h3>
          <p>As a user, you agree to provide accurate, current, and complete information during the checkout and account creation processes. You are responsible for maintaining the confidentiality of your account credentials.</p>

          <h3>7. Company Rights</h3>
          <p>Owl Stitch by Mason reserves the right to modify or discontinue any product or service without notice. We also reserve the right to update these Terms & Conditions at any time.</p>
        </div>
      </div>
    </div>
  );
};

export default TandC;

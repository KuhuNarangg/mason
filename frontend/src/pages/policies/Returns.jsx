import './PolicyPage.css';
import { Link } from 'react-router-dom';

const Returns = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Return & Refund Policy</h1>
        <div className="policy-content">
          <p>Thank you for shopping at Owl Stitch by Mason. If, for any reason, you are not completely satisfied with a purchase, we invite you to review our policy on refunds and returns.</p>
          
          <h3>1. Return Eligibility</h3>
          <p>Returns are allowed within our specified return period (typically 7 days from the date of delivery). To be eligible for a return, your item must be unused, in the same condition that you received it, and must be in the original packaging with all tags attached. <strong>Please Note:</strong> Each garment is shipped with a uniquely numbered Security Seal Tag to ensure authenticity and safeguard against misuse. Returns or refunds will only be accepted if the original Security Seal Tag remains intact and attached to the garment.</p>
          
          <h3>2. Non-Returnable Items</h3>
          <p>Certain types of items cannot be returned, including custom-made products, intimate apparel, and final sale items.</p>

          <h3>3. Return Process</h3>
          <p>To initiate a return, please visit the <Link to="/orders">My Orders</Link> section of your account or contact our support team. Once your return is requested, we will provide you with instructions on how and where to send your package.</p>

          <h3>4. Refund Process & Timeline</h3>
          <p>Returned items must pass our quality inspection before refund approval. Refunds are processed after return approval.</p>
          <p><strong>Please note:</strong> Original shipping charges are non-refundable and will be deducted from your total refund amount.</p>
          <p>Once your return is approved, the refund amount will be credited to your original payment method within <strong>10 business days</strong>. Please remember it can take some time for your bank or credit card company to process and post the refund too.</p>

          <h3>5. Contact Support</h3>
          <p>If you have any questions about our Returns and Refunds Policy, please contact us at <strong>customercare@owlstitch.com</strong>.</p>
        </div>
      </div>
    </div>
  );
};

export default Returns;

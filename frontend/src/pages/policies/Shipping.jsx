import './PolicyPage.css';

const Shipping = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Shipping Policy</h1>
        <div className="policy-content">
          <h3>Domestic Shipping</h3>
          <p>We deliver across India. Orders are generally dispatched within 24-48 hours of order confirmation. Delivery takes 3-7 working days depending on your location.</p>
          
          <h3>Shipping Charges</h3>
          <ul>
            <li><strong>Free Shipping</strong> on all prepaid orders above ₹1,500.</li>
            <li>A flat shipping fee of ₹99 is applicable on orders below ₹1,500.</li>
            <li>For Cash on Delivery (COD) orders, a nominal convenience fee of ₹50 is charged.</li>
          </ul>
          
          <h3>Tracking Your Order</h3>
          <p>Once your order is shipped, you will receive an email and SMS with the tracking link and courier details. You can also track your order directly on our website using the 'Track Order' page.</p>
        </div>
      </div>
    </div>
  );
};

export default Shipping;

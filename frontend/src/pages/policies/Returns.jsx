import './PolicyPage.css';

const Returns = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Returns & Exchange</h1>
        <div className="policy-content">
          <p>We want you to love what you ordered! If you're not completely satisfied, we offer a hassle-free 7-day return and exchange policy.</p>
          
          <h3>Return Conditions</h3>
          <ul>
            <li>Items must be returned within 7 days from the date of delivery.</li>
            <li>Items must be unused, unwashed, and in their original condition.</li>
            <li>All original tags and packaging must be intact.</li>
            <li>Innerwear, accessories, and promotional free items are non-returnable.</li>
          </ul>
          
          <h3>How to Request a Return</h3>
          <p>Go to your Orders page, select the item you wish to return, and click the 'Request Return' button. Our courier partner will pick up the item within 2-3 working days.</p>
          
          <h3>Refund Process</h3>
          <p>Once we receive and inspect the returned item, your refund will be initiated. For prepaid orders, the refund will be credited to the original payment method within 5-7 business days. For COD orders, a store credit or bank transfer link will be provided.</p>
        </div>
      </div>
    </div>
  );
};

export default Returns;

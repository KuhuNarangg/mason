import './PolicyPage.css';

const FAQ = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Frequently Asked Questions</h1>
        <div className="policy-content">
          <h3>Do you offer Cash on Delivery (COD)?</h3>
          <p>Yes! We offer Cash on Delivery on all orders above ₹999 within serviceable pincodes in India.</p>

          <h3>How long will it take to receive my order?</h3>
          <p>Standard delivery typically takes 3-7 business days depending on your location. Metro cities usually receive orders within 3-5 days.</p>

          <h3>Can I return or exchange an item?</h3>
          <p>Yes, we have a hassle-free 7-day return and exchange policy. Please ensure the item is unworn, unwashed, and has all original tags intact. See our Returns page for more details.</p>

          <h3>Do you have a physical store?</h3>
          <p>Yes, our flagship store is located at Mall Road, Kanpur, Uttar Pradesh. We'd love for you to visit!</p>

          <h3>How do I know my correct size?</h3>
          <p>Every product page includes a detailed size chart. Since fits may vary between brands (especially for Indo-Western and Plus Sizes), we recommend checking the specific measurements for each item before purchasing.</p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

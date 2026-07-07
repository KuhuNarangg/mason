import './PolicyPage.css';

const Contact = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Contact Us</h1>
        <div className="policy-content">
          <p>We'd love to hear from you! Whether you have a question about our collections, need help with an order, or just want to say hi, our team is here for you.</p>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <h3>Store Location</h3>
              <p>Mason Fashion Store<br/>Mall Road, Kanpur<br/>Uttar Pradesh, India</p>
              
              <h3>Contact Info</h3>
              <p>Email: customercare@owlstitch.com<br/>Phone: 816-8776809</p>
              
              <h3>Store Hours</h3>
              <p>Monday - Sunday: 10:00 AM - 9:00 PM</p>
            </div>
            
            <div style={{ flex: '1', minWidth: '250px' }}>
              <form className="policy-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}>
                <input type="text" placeholder="Your Name" required />
                <input type="email" placeholder="Your Email" required />
                <input type="text" placeholder="Subject" required />
                <textarea rows="4" placeholder="Your Message" required></textarea>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

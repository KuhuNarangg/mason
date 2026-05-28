import './PolicyPage.css';

const SizeGuide = () => {
  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Size Guide</h1>
        <div className="policy-content">

          <h3>How to Measure</h3>
          <p>For the most accurate fit, use a soft measuring tape and measure directly over your undergarments. Keep the tape snug but not tight.</p>

          <h3>Women's Apparel — General Size Chart (in inches)</h3>
          <div style={{ overflowX: 'auto', margin: '1rem 0 2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f5ede4', textAlign: 'left' }}>
                  {['Size', 'Bust', 'Waist', 'Hips', 'Length'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, borderBottom: '2px solid #e8d5c4' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['XS', '31–32', '24–25', '33–34', '36–38'],
                  ['S',  '33–34', '26–27', '35–36', '37–39'],
                  ['M',  '35–36', '28–29', '37–38', '38–40'],
                  ['L',  '37–38', '30–31', '39–40', '39–41'],
                  ['XL', '39–41', '32–34', '41–43', '40–42'],
                  ['XXL','42–44', '35–37', '44–46', '41–43'],
                ].map(([size, ...vals], i) => (
                  <tr key={size} style={{ background: i % 2 === 0 ? '#fff' : '#fdf9f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#b08d72', borderBottom: '1px solid #f0e4d7' }}>{size}</td>
                    {vals.map((v, j) => (
                      <td key={j} style={{ padding: '0.75rem 1rem', color: '#555', borderBottom: '1px solid #f0e4d7' }}>{v}"</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Ethnic Wear — Kurta & Dress Length</h3>
          <p>Ethnic silhouettes are measured from the shoulder seam to the hem. Lengths may vary slightly per style — always refer to the specific product page measurements.</p>
          <ul>
            <li><strong>Short / Hip Length:</strong> 36–40"</li>
            <li><strong>Knee Length:</strong> 42–46"</li>
            <li><strong>Calf / Midi Length:</strong> 48–52"</li>
            <li><strong>Maxi / Full Length:</strong> 54–58"</li>
          </ul>

          <h3>Plus Size</h3>
          <p>Our Plus Size range begins at 2XL and goes up to 5XL. Each product in the Plus Size category includes individual measurements on the product page for accuracy.</p>

          <h3>Tips for the Best Fit</h3>
          <ul>
            <li>If you're between sizes, we recommend sizing up for ethnic and structured garments.</li>
            <li>For stretchy fabrics like jersey or ribbed knits, you can size down for a fitted look.</li>
            <li>Have questions about a specific product's fit? Reach out via our <a href="/faq" style={{ color: '#b08d72' }}>FAQ & Contact</a> page.</li>
          </ul>

        </div>
      </div>
    </div>
  );
};

export default SizeGuide;

import './PolicyPage.css';

const GarmentCare = () => {
  const careItems = [
    {
      icon: '🧺',
      title: 'Washing',
      points: [
        'Hand wash delicate fabrics (chiffon, georgette, net) in cold water with mild detergent.',
        'Machine wash cotton and denim on a gentle cycle at 30°C or below.',
        'Turn garments inside out before washing to preserve colour and embroidery.',
        'Wash dark colours separately to prevent dye transfer.',
      ],
    },
    {
      icon: '🌬️',
      title: 'Drying',
      points: [
        'Lay flat or hang to dry in shade — avoid direct sunlight to prevent fading.',
        'Do not tumble dry embroidered, embellished, or silk-blend pieces.',
        'Gently reshape garments while damp and allow to air-dry naturally.',
      ],
    },
    {
      icon: '🔥',
      title: 'Ironing',
      points: [
        'Iron cotton and linen on a medium-high setting while slightly damp.',
        'Use a low heat setting or steam for georgette, chiffon, and silk blends.',
        'Iron embroidered or printed areas on the reverse side with a pressing cloth.',
        'Never iron directly over embellishments, sequins, or lace.',
      ],
    },
    {
      icon: '🧳',
      title: 'Storage',
      points: [
        'Store in a cool, dry place away from direct sunlight.',
        'Hang structured pieces (blazers, co-ords) to maintain their shape.',
        'Fold knitwear flat — hanging can cause stretching.',
        'Use muslin or cotton garment bags for long-term storage of delicate pieces.',
      ],
    },
    {
      icon: '✨',
      title: 'Embellished & Special Pieces',
      points: [
        'Dry clean only for heavily embroidered lehengas, anarkalis, and evening gowns.',
        'Spot clean minor stains with a damp cloth — avoid rubbing.',
        'Store embellished garments wrapped in tissue paper to prevent snagging.',
      ],
    },
  ];

  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Garment Care</h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Each Mason piece is crafted to last. A little care goes a long way in preserving the beauty and longevity of your wardrobe.
        </p>

        <div className="policy-content">
          {careItems.map(({ icon, title, points }) => (
            <div key={title} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fdf9f6', border: '1px solid #f0e4d7', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{icon}</span> {title}
              </h3>
              <ul style={{ marginBottom: 0 }}>
                {points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ))}

          <h3>Fabric-Specific Quick Reference</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5ede4' }}>
                  {['Fabric', 'Wash', 'Iron', 'Dry Clean'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', fontWeight: 600, borderBottom: '2px solid #e8d5c4', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Cotton', 'Machine / Hand', 'Medium–High', 'No'],
                  ['Chiffon / Georgette', 'Hand wash only', 'Low with cloth', 'Recommended'],
                  ['Silk / Silk Blend', 'Hand wash / Dry clean', 'Low on reverse', 'Yes'],
                  ['Linen', 'Machine gentle', 'Medium damp', 'No'],
                  ['Embroidered Pieces', 'Spot clean only', 'Reverse low', 'Yes'],
                  ['Knitwear', 'Hand wash cold', 'Do not iron', 'No'],
                ].map(([fabric, ...vals], i) => (
                  <tr key={fabric} style={{ background: i % 2 === 0 ? '#fff' : '#fdf9f6' }}>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, borderBottom: '1px solid #f0e4d7' }}>{fabric}</td>
                    {vals.map((v, j) => (
                      <td key={j} style={{ padding: '0.65rem 1rem', color: '#555', borderBottom: '1px solid #f0e4d7' }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarmentCare;

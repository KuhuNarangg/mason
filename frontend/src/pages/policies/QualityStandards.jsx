import React, { useEffect } from 'react';
import SEO from '../../components/SEO';
import Breadcrumbs from '../../components/Breadcrumbs';
import { generateFAQSchema } from '../../utils/schema';
import './PolicyPage.css';

const QualityStandards = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      question: "Where do you source your fabrics?",
      answer: "We source our fabrics from ethical weavers and certified organic farms across India, ensuring both premium quality and sustainable practices."
    },
    {
      question: "How do you ensure durability?",
      answer: "Every garment undergoes a 5-point quality check, including seam strength testing, colorfastness checks, and fabric shrinkage tests."
    }
  ];

  return (
    <div className="policy-page container fade-in mt-4 mb-5">
      <SEO 
        title="Our Quality Standards"
        description="Learn about Owl Stitch's uncompromising quality standards, ethical sourcing, and manufacturing process."
        url="/quality-standards"
        type="website"
        schema={generateFAQSchema(faqs)}
      />
      <Breadcrumbs crumbs={[
        { name: "Home", path: "/" },
        { name: "Quality Standards", path: "/quality-standards" }
      ]} />
      
      <div className="policy-content">
        <h1 className="font-heading text-center mb-5">Uncompromising Quality Standards</h1>
        
        <div className="policy-section">
          <h2>1. Ethical Sourcing</h2>
          <p>
            At Owl Stitch, true elegance begins with the raw materials. We partner exclusively with suppliers who share our commitment to ethical labor practices and environmental sustainability. Our silks and cottons are certified to be free from harmful chemicals.
          </p>
        </div>

        <div className="policy-section">
          <h2>2. Master Craftsmanship</h2>
          <p>
            Our garments are not mass-produced on an assembly line. Each piece is crafted by skilled artisans who have spent decades perfecting their trade. From the precision of the cut to the final stitch, we ensure absolute perfection.
          </p>
        </div>

        <div className="policy-section">
          <h2>3. The 5-Point Quality Check</h2>
          <ul>
            <li><strong>Fabric Integrity:</strong> Checking for weaving defects and inconsistencies.</li>
            <li><strong>Colorfastness:</strong> Ensuring dyes do not bleed or fade prematurely.</li>
            <li><strong>Seam Strength:</strong> Reinforcing stress points for longevity.</li>
            <li><strong>Measurements:</strong> Strict adherence to our standard and custom size charts.</li>
            <li><strong>Final Finish:</strong> Steam pressing and thread trimming before packaging.</li>
          </ul>
        </div>

        <div className="policy-section">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq, idx) => (
            <div key={idx} className="mb-3">
              <strong>Q: {faq.question}</strong>
              <p className="text-muted">A: {faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Reusable CTA */}
        <div className="cta-banner mt-5 text-center p-5" style={{ background: 'var(--champagne)', borderRadius: '12px' }}>
          <h3 className="font-heading mb-3">Ready to design your own?</h3>
          <p className="text-muted mb-4">Experience our quality firsthand with a custom-tailored outfit.</p>
          <a href="/custom-tailoring" className="btn btn-primary">Customize Now</a>
        </div>
      </div>
    </div>
  );
};

export default QualityStandards;

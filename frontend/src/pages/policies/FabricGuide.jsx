import React from 'react';
import SEO from '../../components/SEO';
import { generateFAQSchema } from '../../utils/schema';
import './PolicyPage.css';

const FabricGuide = () => {
  const faqs = [
    {
      question: "What makes your cotton fabrics unique?",
      answer: "Our cotton is sustainably sourced and woven using traditional techniques. It is highly breathable, hypoallergenic, and becomes softer with every wash, making it perfect for both daily wear and elegant casuals."
    },
    {
      question: "How do I care for silk garments?",
      answer: "Silk requires delicate care. We recommend dry cleaning for the best results. If hand washing, use cold water and a mild detergent. Never wring silk or dry it in direct sunlight."
    },
    {
      question: "Are your dyes eco-friendly?",
      answer: "Yes, we prioritize using AZO-free, eco-friendly dyes that are safe for your skin and the environment. This ensures vibrant colors without the harmful chemical footprint."
    },
    {
      question: "What is Chanderi fabric?",
      answer: "Chanderi is a traditional ethnic fabric characterized by its lightweight, sheer texture and fine luxurious feel. We use premium Chanderi silk and cotton blends for our heritage edits."
    }
  ];

  return (
    <div className="policy-page fade-in">
      <SEO 
        title="Fabric Guide"
        description="Discover the premium fabrics and sustainable materials used in Owl Stitch by Mason's collections. Learn about our cotton, silk, and heritage textiles."
        url="/fabric-guide"
        schema={generateFAQSchema(faqs)}
      />
      <div className="container policy-container">
        <h1 className="policy-title">Fabric Guide</h1>
        <div className="policy-content">
          <p className="lead" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            At the heart of every great garment is exceptional fabric. We source only the finest, most sustainable materials to craft our collections, ensuring every piece feels as good as it looks.
          </p>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>Our Signature Cottons</h3>
          <p>
            Breathable, durable, and naturally soft. Our signature cottons are hand-selected to provide all-day comfort. Perfect for our oversized t-shirts, couple sets, and everyday dresses. We focus on ethical farming practices to reduce our environmental impact.
          </p>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>Luxurious Silks & Blends</h3>
          <p>
            Used prominently in our Heritage and Party Wear edits, our silks offer a brilliant drape and a subtle, sophisticated sheen. We blend silk with natural fibers to improve durability and wearability without compromising on elegance.
          </p>
          
          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>Premium Fleece & Winter Wear</h3>
          <p>
            Our hoodies and winter collections are crafted using high-density, brushed fleece. This provides superior insulation, a plush interior feel, and a structured exterior that holds its shape beautifully over time.
          </p>

          <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Fabric FAQs</h2>
          <div className="faq-section">
            {faqs.map((faq, index) => (
              <div key={index} style={{ marginBottom: '1.5rem', background: 'var(--champagne-light)', padding: '1.5rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>{faq.question}</h4>
                <p style={{ margin: 0, color: 'var(--ink-muted)' }}>{faq.answer}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FabricGuide;

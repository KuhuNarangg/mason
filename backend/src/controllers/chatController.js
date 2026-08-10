const Groq = require('groq-sdk');
const Product = require('../models/Product');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Tool Definitions for Groq
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for Mason products based on user queries like category, color, or style. Always use this to check product availability and inventory before recommending items.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g. "black shirt", "customizable jeans", "dresses").'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Get deep details about a specific product, including all available sizes, colors, real-time stock, pricing, and exact customization options.',
      parameters: {
        type: 'object',
        properties: {
          product_name: {
            type: 'string',
            description: 'The exact name of the product to fetch.'
          }
        },
        required: ['product_name']
      }
    }
  }
];

// Format raw Product document into product card payload for front-end catalog rendering
const formatProductCard = (p) => {
  const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
  const image = (p.images && p.images.length > 0 ? p.images[0] : p.thumbnail) || '';
  return {
    _id: p._id.toString(),
    name: p.name,
    slug: p.slug || p._id.toString(),
    price: p.price,
    originalPrice: p.originalPrice || p.price,
    discount: p.discount || 0,
    image: image,
    brand: p.brand || 'Mason',
    type: p.type,
    inStock: totalStock > 0
  };
};

// Direct DB product search fallback logic
const searchProductsInDB = async (rawQuery) => {
  try {
    const stopWords = ['show', 'me', 'your', 'latest', 'the', 'a', 'an', 'products', 'collection', 'items', 'do', 'you', 'have', 'any', 'wear', 'look', 'for', 'want', 'i', 'need'];
    const rawWords = (rawQuery || '').toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/gi, ''))
      .filter(w => w.length > 2 && !stopWords.includes(w));

    const keywords = [];
    rawWords.forEach(w => {
      keywords.push(w);
      if (w.endsWith('es') && w.length > 4) {
        keywords.push(w.slice(0, -2));
      } else if (w.endsWith('s') && w.length > 3) {
        keywords.push(w.slice(0, -1));
      }
    });

    let searchConditions = [];
    if (keywords.length > 0) {
      searchConditions = keywords.map(kw => ({
        $or: [
          { name: { $regex: kw, $options: 'i' } },
          { description: { $regex: kw, $options: 'i' } },
          { tags: { $regex: kw, $options: 'i' } },
          { type: { $regex: kw, $options: 'i' } },
          { brand: { $regex: kw, $options: 'i' } }
        ]
      }));
    } else {
      searchConditions = [{
        $or: [
          { name: { $regex: rawQuery, $options: 'i' } },
          { description: { $regex: rawQuery, $options: 'i' } }
        ]
      }];
    }

    let products = await Product.find({
      isActive: true,
      $or: searchConditions.flatMap(sc => sc.$or)
    }).limit(6).lean();

    if (products.length === 0) {
      products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(6).lean();
    }

    return products;
  } catch (err) {
    console.error("DB Search error:", err);
    return [];
  }
};

// Helper function: Execute search_products tool
const executeSearchProducts = async (args, productTrackerMap) => {
  try {
    const products = await searchProductsInDB(args.query);

    if (products.length === 0) {
      return JSON.stringify({ result: "No products currently available in database." });
    }

    // Collect products into tracker map
    products.forEach(p => {
      const card = formatProductCard(p);
      productTrackerMap.set(card._id, card);
    });

    return JSON.stringify(products.map(p => {
      const colors = [...new Set((p.variants || []).map(v => v.color).filter(Boolean))];
      const sizes = [...new Set((p.variants || []).map(v => v.size).filter(Boolean))];
      const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);

      return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug || p._id.toString(),
        price: `₹${p.price}`,
        originalPrice: `₹${p.originalPrice || p.price}`,
        image: (p.images && p.images.length > 0 ? p.images[0] : p.thumbnail) || '',
        type: p.type,
        brand: p.brand,
        colors: colors.length > 0 ? colors : ['Standard'],
        sizes: sizes.length > 0 ? sizes : ['Standard'],
        inStock: totalStock > 0,
        isCustomizable: p.type === 'custom-tailoring' || (p.description && p.description.toLowerCase().includes('custom'))
      };
    }));
  } catch (error) {
    console.error("Error in search_products tool:", error);
    return JSON.stringify({ error: "Failed to search products." });
  }
};

// Helper function: Execute get_product_details tool
const executeGetProductDetails = async (args, productTrackerMap) => {
  try {
    const productName = args.product_name;
    const product = await Product.findOne({
      name: { $regex: productName, $options: 'i' },
      isActive: true
    }).lean();

    if (!product) {
      return JSON.stringify({ result: "Product details not found." });
    }

    const card = formatProductCard(product);
    productTrackerMap.set(card._id, card);

    return JSON.stringify({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug || product._id.toString(),
      price: product.price,
      originalPrice: product.originalPrice,
      image: card.image,
      description: product.description,
      variants: product.variants || [],
      isCustomizable: product.type === 'custom-tailoring' || (product.description && product.description.toLowerCase().includes('custom')),
      tags: product.tags || []
    });
  } catch (error) {
    console.error("Error in get_product_details tool:", error);
    return JSON.stringify({ error: "Failed to fetch product details." });
  }
};

// System Prompt
const SYSTEM_PROMPT = `You are Mason's AI fashion assistant. 
Your purpose is to help users with Mason products, clothing, outfits, customization, availability, sizing, colors, and Mason website information.

CRITICAL TRUTHFULNESS & ACCURACY RULES:
1. CONFIRMED DATA: Answer confidently based ONLY on actual product data returned by your tools (search_products, get_product_details). NEVER invent or hallucinate prices, colors, sizes, stock, or products. ALL prices are in Indian Rupees (₹), DO NOT use Dollars ($).
2. UNKNOWN / DATA NOT AVAILABLE: If the exact requested color, variant, or item is not found in your database tool results, mention any close matching products that ARE available (e.g. "We currently have the **Blue Flowing Skirt** available for ₹2800..."), and then politely state: "However, I couldn't confirm that from our current product information. You can leave a query with our team, and one of our representatives will get in touch with you."
3. CONFIRMED UNAVAILABLE: Only say an item, size, or color is unavailable when reliable database tool data explicitly confirms that an existing product is out of stock or missing that specific size/color variant.
4. PRODUCT CATALOG DISPLAY: When users ask to see dresses, outfits, skirts, shirts, or any clothing items, ALWAYS call the search_products tool so matching products can be searched and displayed visually with product cards!
5. CUSTOMIZATION INQUIRIES:
   - If a user asks "Can this be customized?", "Can I customize this?", "I want a custom version of this product", or asks for custom designs/colors:
   - Guide them to our Customization section (/customization page).
   - Offer: "Yes, we can help with customization! Please describe the customization you'd like, and leave your contact details so our team can get in touch with you."

STORE POLICIES:
- Payment & COD Policy: Cash on Delivery (COD) is available on all eligible orders across India. We also accept online payments (UPI, Credit/Debit Cards, Net Banking) via Razorpay.
- Return Policy: Returns allowed within 7 days. Must be unused with original Security Seal Tag attached. Custom-made items and final sale items are non-returnable. Refunds take up to 10 business days after inspection. Contact customercare@owlstitch.com for support.

STYLE & PAIRING ADVICE:
- You are an expert fashion stylist. When users ask outfit styling or pairing questions (e.g., "What can I pair with a white skirt?"), suggest elegant fashion combinations and call search_products to locate real matching items from the Mason store.

GENERAL:
- If a question is completely unrelated to Mason, fashion, clothing, outfits, or the Mason website (e.g. politics, coding, weather), politely refuse: "I'm Mason's fashion assistant, so I can only help with Mason products, clothing, outfits, customization, and website-related questions."
- Keep responses concise, friendly, customer-centric, and formatted with markdown bolding for product names.`;

// Helper for calling Groq with fallback models
const createGroqCompletion = async (groqMessages) => {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await groq.chat.completions.create({
        model: model,
        messages: groqMessages,
        tools: tools,
        tool_choice: 'auto',
        max_tokens: 1200,
      });
      return response;
    } catch (err) {
      console.warn(`Groq completion with model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
};

// Main Chat Controller
exports.handleChat = async (req, res) => {
  let groqMessages = [];
  const productTrackerMap = new Map();

  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required." });
    }

    const lastUserMsgObj = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = lastUserMsgObj ? lastUserMsgObj.content : '';

    // Prepare messages array for Groq
    groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    let response;
    try {
      response = await createGroqCompletion(groqMessages);
    } catch (apiErr) {
      console.error("Groq API error, engaging database direct search fallback:", apiErr);
      
      // Fallback: search products directly in DB for user query
      const fallbackRawProducts = await searchProductsInDB(userQuery);
      const fallbackCards = fallbackRawProducts.map(formatProductCard);

      let fallbackText = "Here are matching options from our collection:";
      if (fallbackCards.length === 0) {
        fallbackText = "I am currently unable to fetch live AI recommendations, but you can explore our latest collection on our catalog page or leave a query with our team!";
      } else if (userQuery.toLowerCase().includes('dress')) {
        fallbackText = "Here are some of our beautiful dresses available in our Mason store:";
      }

      return res.status(200).json({
        success: true,
        message: fallbackText,
        products: fallbackCards
      });
    }

    let responseMessage = response.choices[0].message;
    let toolCalls = responseMessage.tool_calls;

    // Handle tool calls recursively (up to 3 times to prevent infinite loops)
    let iterations = 0;
    while (toolCalls && iterations < 3) {
      groqMessages.push(responseMessage);

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch (e) {
          functionArgs = { query: userQuery };
        }

        let functionResponse;
        if (functionName === 'search_products') {
          functionResponse = await executeSearchProducts(functionArgs, productTrackerMap);
        } else if (functionName === 'get_product_details') {
          functionResponse = await executeGetProductDetails(functionArgs, productTrackerMap);
        } else {
          functionResponse = JSON.stringify({ error: "Unknown function" });
        }

        groqMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResponse,
        });
      }

      try {
        response = await createGroqCompletion(groqMessages);
        responseMessage = response.choices[0].message;
        toolCalls = responseMessage.tool_calls;
      } catch (loopErr) {
        console.warn("Groq completion in tool loop failed:", loopErr);
        break;
      }

      iterations++;
    }

    // Check if products were queried directly or implicitly for queries like "dresses"
    let finalProducts = Array.from(productTrackerMap.values());
    if (finalProducts.length === 0 && (userQuery.toLowerCase().includes('dress') || userQuery.toLowerCase().includes('product') || userQuery.toLowerCase().includes('shirt') || userQuery.toLowerCase().includes('skirt') || userQuery.toLowerCase().includes('top') || userQuery.toLowerCase().includes('wear'))) {
      const directProducts = await searchProductsInDB(userQuery);
      finalProducts = directProducts.map(formatProductCard);
    }

    return res.status(200).json({
      success: true,
      message: responseMessage.content || "Here are some of our top picks for you:",
      products: finalProducts
    });

  } catch (error) {
    console.error("Chatbot Error:", error);
    
    // Safety Net Fallback
    const lastUserMsgObj = req.body?.messages ? [...req.body.messages].reverse().find(m => m.role === 'user') : null;
    const userQuery = lastUserMsgObj ? lastUserMsgObj.content : '';
    const fallbackRawProducts = await searchProductsInDB(userQuery);
    const fallbackCards = fallbackRawProducts.map(formatProductCard);

    return res.status(200).json({ 
      success: true, 
      message: "Here are some items from our catalog that you might like:",
      products: fallbackCards
    });
  }
};

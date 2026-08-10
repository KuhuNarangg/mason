const Groq = require('groq-sdk');
const Product = require('../models/Product');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Category Nouns & Color Dictionary for Smart Scoped Search
const CATEGORY_NOUNS = [
  'skirt', 'dresses', 'dress', 'shirts', 'shirt', 'tops', 'top', 
  'lehenga', 'kurta', 'kurtis', 'kurti', 'saree', 'anarkali', 
  'trousers', 'trouser', 'pants', 'pant', 'jeans', 'hoodies', 'hoodie', 
  'gowns', 'gown', 'jackets', 'jacket', 'ethnic', 'co-ord', 'suit', 
  'blouse', 'blouses', 'corset'
];

const COLOR_WORDS = [
  'white', 'black', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 
  'navy', 'beige', 'gold', 'silver', 'cream', 'ivory', 'champagne', 'emerald', 'maroon'
];

// Tool Definitions for Groq
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for Mason products based on user queries like category, color, or style. ONLY use this when the user explicitly asks to view, find, show, or recommend specific products or categories.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g. "black shirt", "customizable jeans", "skirt", "dresses").'
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

// Strict Category & Color DB Product Search Logic
const searchProductsInDB = async (rawQuery) => {
  try {
    const queryLower = (rawQuery || '').toLowerCase();
    const queryWords = queryLower
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/gi, ''))
      .filter(Boolean);

    // Identify category noun and color word from user query
    const foundCategory = CATEGORY_NOUNS.find(cat => queryWords.includes(cat) || queryLower.includes(cat));
    const foundColor = COLOR_WORDS.find(c => queryWords.includes(c) || queryLower.includes(c));

    // Normalize category keyword (e.g. "skirts" -> "skirt", "dresses" -> "dress")
    let normalizedCategory = foundCategory;
    if (foundCategory) {
      if (foundCategory.endsWith('es') && foundCategory.length > 4) {
        normalizedCategory = foundCategory.slice(0, -2);
      } else if (foundCategory.endsWith('s') && foundCategory.length > 3) {
        normalizedCategory = foundCategory.slice(0, -1);
      }
    }

    // STEP 1: If category is explicitly requested (e.g. "skirt")
    if (normalizedCategory) {
      const categoryRegex = new RegExp(normalizedCategory, 'i');
      
      const categoryMatchCondition = {
        $or: [
          { name: categoryRegex },
          { type: categoryRegex },
          { description: categoryRegex },
          { tags: categoryRegex }
        ]
      };

      // 1A. Try Category + Color match
      if (foundColor) {
        const colorRegex = new RegExp(foundColor, 'i');
        const colorMatchCondition = {
          $or: [
            { name: colorRegex },
            { description: colorRegex },
            { tags: colorRegex },
            { 'variants.color': colorRegex }
          ]
        };

        const categoryAndColorProducts = await Product.find({
          isActive: true,
          $and: [categoryMatchCondition, colorMatchCondition]
        }).limit(6).lean();

        if (categoryAndColorProducts.length > 0) {
          return categoryAndColorProducts;
        }
      }

      // 1B. Category match ONLY (Strictly restrict to requested category)
      const categoryOnlyProducts = await Product.find({
        isActive: true,
        ...categoryMatchCondition
      }).limit(6).lean();

      if (categoryOnlyProducts.length > 0) {
        return categoryOnlyProducts;
      }
    }

    // STEP 2: General Keyword Search (when no specific category matched)
    const stopWords = ['show', 'me', 'your', 'latest', 'the', 'a', 'an', 'products', 'collection', 'items', 'do', 'you', 'have', 'any', 'wear', 'look', 'for', 'want', 'i', 'need'];
    const filteredKeywords = queryWords.filter(w => w.length > 2 && !stopWords.includes(w));

    if (filteredKeywords.length > 0) {
      const searchConditions = filteredKeywords.map(kw => ({
        $or: [
          { name: { $regex: kw, $options: 'i' } },
          { description: { $regex: kw, $options: 'i' } },
          { tags: { $regex: kw, $options: 'i' } },
          { type: { $regex: kw, $options: 'i' } },
          { brand: { $regex: kw, $options: 'i' } }
        ]
      }));

      const keywordProducts = await Product.find({
        isActive: true,
        $or: searchConditions.flatMap(sc => sc.$or)
      }).limit(6).lean();

      if (keywordProducts.length > 0) {
        return keywordProducts;
      }
    }

    // Fallback: Recent active products if no keywords matched
    return await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(6).lean();
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
const SYSTEM_PROMPT = `You are OwlStitch AI, Mason's official AI fashion assistant. 
Your purpose is to help users with Mason products, clothing, outfits, customization, availability, sizing, colors, and Mason website information.

CRITICAL RULES FOR PRODUCT DISPLAY & CATEGORY ACCURACY:
1. STRICT CATEGORY ACCURACY: When a user asks for a specific apparel category (e.g. "skirt", "dress", "shirt", "lehenga", "kurta"), ONLY recommend and display products matching that EXACT category. Never recommend dresses or blouses when asked for skirts!
2. COLOR AVAILABILITY TRUTHFULNESS: If the user asks for a specific color variant (e.g. "white skirt") and we do NOT have that color in stock, state clearly: "We currently don't have a white version in stock, but here is our **[Product Name]** available in our collection:" and show ONLY items of that requested category (e.g., skirts). Also remind them: "You can also request a custom white skirt on our Customisation page!"
3. EXPLICIT PRODUCT REQUESTS ONLY: ONLY call search_products or get_product_details when the user explicitly asks to view, find, show, browse, or recommend specific clothing products or categories.
4. DO NOT SHOW PRODUCTS FOR GENERAL/POLICY QUESTIONS: For questions about customization capabilities ("Can you customize this?"), store policies (COD, payment, return policy), answer clearly in text and DO NOT display product cards.

STORE POLICIES:
- Payment & COD Policy: Cash on Delivery (COD) is available on all eligible orders across India. We also accept online payments (UPI, Credit/Debit Cards, Net Banking) via Razorpay.
- Return Policy: Returns allowed within 7 days. Must be unused with original Security Seal Tag attached. Custom-made items and final sale items are non-returnable. Refunds take up to 10 business days after inspection. Contact customercare@owlstitch.com for support.

GENERAL:
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
      
      // Catch tool_use_failed (Groq 400 XML generation error)
      if (err?.error?.error?.code === 'tool_use_failed') {
        const failedGen = err?.error?.error?.failed_generation || '';
        return {
          isToolUseFailed: true,
          failedGen: failedGen,
          choices: [
            {
              message: {
                role: 'assistant',
                content: failedGen
              }
            }
          ]
        };
      }

      lastError = err;
    }
  }
  throw lastError;
};

// Parse and clean any inline hallucinated <function=...> tags from model output
const parseAndCleanInlineToolCalls = async (rawContent, productTrackerMap) => {
  if (!rawContent || (!rawContent.includes('<function=') && !rawContent.includes('search_products'))) {
    return rawContent;
  }

  const funcMatches = [...rawContent.matchAll(/<function=([a-zA-Z0-9_]+)=?\s*(\{.*?\})\s*(?:<\/function>)?/gs)];

  for (const match of funcMatches) {
    const funcName = match[1];
    try {
      const funcArgs = JSON.parse(match[2]);
      if (funcName === 'search_products') {
        await executeSearchProducts(funcArgs, productTrackerMap);
      } else if (funcName === 'get_product_details') {
        await executeGetProductDetails(funcArgs, productTrackerMap);
      }
    } catch (err) {
      const qMatch = match[2].match(/"query"\s*:\s*"([^"]+)"/);
      if (qMatch) {
        await executeSearchProducts({ query: qMatch[1] }, productTrackerMap);
      }
    }
  }

  if (productTrackerMap.size === 0) {
    const qMatch = rawContent.match(/"query"\s*:\s*"([^"]+)"/);
    if (qMatch) {
      await executeSearchProducts({ query: qMatch[1] }, productTrackerMap);
    }
  }

  let cleaned = rawContent.replace(/<function=.*?>.*?<\/function>/gs, '');
  cleaned = cleaned.replace(/<function=.*?>/gs, '');
  cleaned = cleaned.replace(/<function=.*?$/gs, '');
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  if (!cleaned) {
    cleaned = "Here are matching options from our collection:";
  }

  return cleaned;
};

// Intent checker to verify if user query is asking for policy/customization general help vs explicit product browsing
const checkQueryIntent = (queryStr) => {
  const q = (queryStr || '').toLowerCase();
  
  const isExplicitProduct = /\b(show|view|find|recommend|buy|look for|catalog|catalogue|collection|dresses|skirt|top|shirt|lehenga|kurta|saree|ethnic|gowns|outfit|pants|trouser|jeans|hoodie|sweater|wear)\b/i.test(q);
  const isGeneralOrPolicy = /\b(customis|customiz|policy|return|cod|cash on delivery|delivery|shipping|payment|how to|contact|representative|help|pair|wear with|can you|do you|what is)\b/i.test(q);

  return { isExplicitProduct, isGeneralOrPolicy };
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
    const { isExplicitProduct, isGeneralOrPolicy } = checkQueryIntent(userQuery);

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
      console.error("Groq API error, engaging direct fallback:", apiErr);
      
      if (isGeneralOrPolicy && !isExplicitProduct) {
        return res.status(200).json({
          success: true,
          message: "Yes, we offer customization! You can design custom t-shirts, couple sets, hoodies, and dresses on our Customisation page (/customisation). If you have a specific custom request, leave a query and our team will contact you.",
          products: []
        });
      }

      const fallbackRawProducts = await searchProductsInDB(userQuery);
      const fallbackCards = fallbackRawProducts.map(formatProductCard);

      return res.status(200).json({
        success: true,
        message: "Here are matching options from our store:",
        products: fallbackCards
      });
    }

    // Handle tool_use_failed intercept (Groq XML 400 error recovery)
    if (response.isToolUseFailed) {
      let finalContent = await parseAndCleanInlineToolCalls(response.failedGen, productTrackerMap);

      let finalProducts = [];
      if (!isGeneralOrPolicy || isExplicitProduct) {
        finalProducts = Array.from(productTrackerMap.values());
        if (finalProducts.length === 0 && isExplicitProduct) {
          const directProducts = await searchProductsInDB(userQuery);
          finalProducts = directProducts.map(formatProductCard);
        }
      }

      return res.status(200).json({
        success: true,
        message: finalContent || "Here are matching items from our store:",
        products: finalProducts
      });
    }

    let responseMessage = response.choices[0].message;
    let toolCalls = responseMessage.tool_calls;

    // Handle standard tool calls recursively
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
        if (response.isToolUseFailed) {
          await parseAndCleanInlineToolCalls(response.failedGen, productTrackerMap);
          break;
        }
        responseMessage = response.choices[0].message;
        toolCalls = responseMessage.tool_calls;
      } catch (loopErr) {
        console.warn("Groq completion in tool loop failed:", loopErr);
        break;
      }

      iterations++;
    }

    // Clean inline hallucinated function tags if any exist in final content
    let finalContent = await parseAndCleanInlineToolCalls(responseMessage.content || '', productTrackerMap);

    // Filter final products based on strict category scoping
    let finalProducts = [];
    if (!isGeneralOrPolicy || isExplicitProduct) {
      finalProducts = Array.from(productTrackerMap.values());
      
      if (isExplicitProduct) {
        const directProducts = await searchProductsInDB(userQuery);
        finalProducts = directProducts.map(formatProductCard);
      }
    }

    return res.status(200).json({
      success: true,
      message: finalContent || "How else can I assist you today?",
      products: finalProducts
    });

  } catch (error) {
    console.error("Chatbot Error:", error);
    
    return res.status(200).json({ 
      success: true, 
      message: "I am Mason's AI assistant. You can ask about our clothing, return policy, COD options, or visit our Customisation section to design your own apparel!",
      products: []
    });
  }
};

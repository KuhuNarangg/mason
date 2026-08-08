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

// Helper function: Execute search_products tool
const executeSearchProducts = async (args) => {
  try {
    const rawQuery = args.query || '';
    
    // Stopwords filter to handle conversational queries like "do you have skirts"
    const stopWords = ['show', 'me', 'your', 'latest', 'the', 'a', 'an', 'products', 'collection', 'items', 'do', 'you', 'have', 'any', 'wear'];
    const rawWords = rawQuery.toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/gi, ''))
      .filter(w => w.length > 2 && !stopWords.includes(w));

    // Stemming logic: Add singular forms for plurals (e.g. "skirts" -> "skirt", "dresses" -> "dress")
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

    const products = await Product.find({
      isActive: true,
      $or: searchConditions.flatMap(sc => sc.$or)
    }).limit(6).lean();

    if (products.length === 0) {
      return JSON.stringify({ result: "No matching products found in database." });
    }

    return JSON.stringify(products.map(p => {
      const colors = [...new Set((p.variants || []).map(v => v.color).filter(Boolean))];
      const sizes = [...new Set((p.variants || []).map(v => v.size).filter(Boolean))];
      const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);

      return {
        name: p.name,
        price: `₹${p.price}`,
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
const executeGetProductDetails = async (args) => {
  try {
    const productName = args.product_name;
    const product = await Product.findOne({
      name: { $regex: productName, $options: 'i' },
      isActive: true
    }).lean();

    if (!product) {
      return JSON.stringify({ result: "Product details not found." });
    }

    return JSON.stringify({
      name: product.name,
      price: product.price,
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
2. UNKNOWN / DATA NOT AVAILABLE: If your tools do not return matching product information, DO NOT guess and DO NOT say "No, it does not exist". Simply reply: "I couldn't confirm that from our current product information. You can leave a query with our team, and one of our representatives will get in touch with you."
3. CONFIRMED UNAVAILABLE: Only say an item, size, or color is unavailable when reliable database tool data explicitly confirms that an existing product is out of stock or missing that specific size/color variant.
4. CUSTOMIZATION INQUIRIES:
   - If a user asks "Can this be customized?", "Can I customize this?", "I want a custom version of this product", or asks for custom designs/colors:
   - If Mason's custom tailoring feature supports it, guide them to our Customization section (/customization page).
   - If you cannot confirm whether the requested customization is possible, do NOT guess. Offer: "Yes, we can help with customization! Please describe the customization you'd like, and leave your contact details so our team can get in touch with you."

STORE POLICIES:
- Return Policy: Returns allowed within 7 days. Must be unused with original Security Seal Tag attached. Custom-made items and final sale items are non-returnable. Refunds take up to 10 business days after inspection. Original shipping charges are non-refundable. Contact customercare@owlstitch.com for support.

GENERAL:
- If a question is completely unrelated to Mason, fashion, clothing, outfits, or the Mason website (e.g. politics, coding, weather), politely refuse: "I'm Mason's fashion assistant, so I can only help with Mason products, clothing, outfits, customization, and website-related questions."
- Keep responses concise, friendly, customer-centric, and formatted with markdown bolding for product names.`;

// Main Chat Controller
exports.handleChat = async (req, res) => {
  let groqMessages = [];
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required." });
    }

    // Prepare messages array for Groq
    groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role, // 'user' or 'assistant'
        content: m.content
      }))
    ];

    let response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      tools: tools,
      tool_choice: 'auto',
      max_tokens: 500,
    });

    let responseMessage = response.choices[0].message;
    let toolCalls = responseMessage.tool_calls;

    // Handle tool calls recursively (up to 3 times to prevent infinite loops)
    let iterations = 0;
    while (toolCalls && iterations < 3) {
      // Append the assistant's tool call message
      groqMessages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResponse;

        if (functionName === 'search_products') {
          functionResponse = await executeSearchProducts(functionArgs);
        } else if (functionName === 'get_product_details') {
          functionResponse = await executeGetProductDetails(functionArgs);
        } else {
          functionResponse = JSON.stringify({ error: "Unknown function" });
        }

        // Append the tool response
        groqMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResponse,
        });
      }

      // Call Groq again with the tool responses
      response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        tools: tools,
        tool_choice: 'auto',
        max_tokens: 500,
      });

      responseMessage = response.choices[0].message;
      toolCalls = responseMessage.tool_calls;
      iterations++;
    }

    res.status(200).json({
      success: true,
      message: responseMessage.content
    });

  } catch (error) {
    console.error("Chatbot Error:", error);
    
    // Check if it's a Groq tool use failure (hallucinated XML tags)
    if (error?.error?.error?.code === 'tool_use_failed') {
      const failedGen = error.error.error.failed_generation;
      
      // Try to manually extract the tool call if the model used XML format by mistake
      if (failedGen && failedGen.includes('<function=')) {
        try {
          // Extracts: <function=search_products {"query": "skirt"}</function> or similar
          const match = failedGen.match(/<function=([a-zA-Z0-9_]+)[^\{]*(\{.*?\})/s);
          if (match) {
            const funcName = match[1];
            const funcArgs = JSON.parse(match[2]);
            
            // Execute it manually
            let funcRes;
            if (funcName === 'search_products') funcRes = await executeSearchProducts(funcArgs);
            else if (funcName === 'get_product_details') funcRes = await executeGetProductDetails(funcArgs);
            
            if (funcRes) {
              // Feed it back to the model manually
              const newResponse = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                  ...groqMessages,
                  { role: 'assistant', content: "Let me check that for you." },
                  { role: 'tool', tool_call_id: 'call_fallback', name: funcName, content: funcRes }
                ],
                max_tokens: 500,
              });
              
              return res.status(200).json({ success: true, message: newResponse.choices[0].message.content });
            }
          }
        } catch (e) {
          console.error("Regex parsing fallback failed:", e);
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "I couldn't confirm that from our current product information. You can leave a query with our team, and one of our representatives will get in touch with you." 
      });
    }

    res.status(500).json({ success: false, message: "Failed to process chat request." });
  }
};

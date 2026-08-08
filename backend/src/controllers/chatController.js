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

// Tool Execution Functions
const executeSearchProducts = async (args) => {
  try {
    const query = args.query;
    // Perform text search on Product model
    const products = await Product.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .lean();

    if (products.length === 0) {
      // Fallback to basic regex if text search fails
      const fallbackProducts = await Product.find({
        name: { $regex: query, $options: 'i' },
        isActive: true
      }).limit(5).lean();
      
      if (fallbackProducts.length === 0) return JSON.stringify({ result: "No products found matching the query." });
      
      return JSON.stringify(fallbackProducts.map(p => ({
        name: p.name,
        price: p.price,
        slug: p.slug,
        type: p.type
      })));
    }

    return JSON.stringify(products.map(p => ({
      name: p.name,
      price: p.price,
      slug: p.slug,
      type: p.type
    })));
  } catch (error) {
    console.error("Error in search_products tool:", error);
    return JSON.stringify({ error: "Failed to search products." });
  }
};

const executeGetProductDetails = async (args) => {
  try {
    const productName = args.product_name;
    const product = await Product.findOne({
      name: { $regex: new RegExp('^' + productName + '$', 'i') },
      isActive: true
    }).lean();

    if (!product) return JSON.stringify({ result: "Product not found." });

    // Format the response for the LLM
    return JSON.stringify({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      isCustomizable: product.type === 'custom-tailoring' || product.description.toLowerCase().includes('custom'), // basic check
      availableVariants: product.variants.map(v => ({
        size: v.size,
        color: v.color,
        stock: v.stock
      })),
      sizeGuide: product.sizeGuide || [],
      isReturnable: product.isReturnable,
      tags: product.tags
    });
  } catch (error) {
    console.error("Error in get_product_details tool:", error);
    return JSON.stringify({ error: "Failed to fetch product details." });
  }
};

// System Prompt
const SYSTEM_PROMPT = `You are Mason's AI fashion assistant. 
Your purpose is to help users with Mason products, clothing, outfits, customization, availability, sizing, colors, and Mason website information. 
For product-specific information, ALWAYS use the provided tools (search_products, get_product_details) to query the Mason database. NEVER invent or hallucinate prices, colors, sizes, stock, or products.
If you need to know if a product exists or is in stock, use a tool first before answering.
If a question is unrelated to Mason, fashion, clothing, outfits, or the Mason website (e.g. politics, coding, weather), you MUST politely refuse to answer and state: "I'm Mason's fashion assistant, so I can only help with Mason products, clothing, outfits, customization, and website-related questions."
Keep responses concise, friendly, and formatted nicely (use markdown bolding for product names or prices).`;

// Main Chat Controller
exports.handleChat = async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required." });
    }

    // Prepare messages array for Groq
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role, // 'user' or 'assistant'
        content: m.content
      }))
    ];

    let response = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
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
        model: 'llama-3.1-70b-versatile',
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
    res.status(500).json({ success: false, message: "Failed to process chat request." });
  }
};

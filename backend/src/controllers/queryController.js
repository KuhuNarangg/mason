const Query = require('../models/Query');

// Submit a new query (Public / Authenticated)
exports.createQuery = async (req, res) => {
  try {
    const { name, email, phone, query, product, source } = req.body;

    if (!name || !email || !query) {
      return res.status(400).json({ success: false, message: 'Name, email, and query message are required.' });
    }

    const newQuery = new Query({
      user: req.user ? req.user._id : null,
      name,
      email,
      phone: phone || (req.user ? req.user.phone || '' : ''),
      query,
      product: product || '',
      source: source || 'AI Chatbot',
      status: 'New'
    });

    await newQuery.save();

    res.status(201).json({
      success: true,
      message: 'Your query has been submitted successfully. Our team will get in touch with you soon.',
      query: newQuery
    });
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({ success: false, message: 'Failed to submit query.' });
  }
};

// Get all queries (Admin)
exports.getQueries = async (req, res) => {
  try {
    const queries = await Query.find()
      .populate('user', 'name email phone role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: queries.length,
      queries
    });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queries.' });
  }
};

// Update query status / notes (Admin)
exports.updateQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const queryItem = await Query.findById(id);
    if (!queryItem) {
      return res.status(404).json({ success: false, message: 'Query not found.' });
    }

    if (status && ['New', 'In Progress', 'Resolved'].includes(status)) {
      queryItem.status = status;
    }
    if (notes !== undefined) {
      queryItem.notes = notes;
    }

    await queryItem.save();

    res.status(200).json({
      success: true,
      message: 'Query updated successfully.',
      query: queryItem
    });
  } catch (error) {
    console.error('Error updating query:', error);
    res.status(500).json({ success: false, message: 'Failed to update query.' });
  }
};

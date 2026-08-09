import Document from '../models/Document.js';

// GET /api/search?q=backend&page=1&limit=10
export const searchDocuments = async (req, res) => {
  try {
    // 1. Read query parameters
    const q = req.query.q?.trim();
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    // 2. Validate search query
    if (!q) {
      return res.status(400).json({
        message: 'Search query is required',
      });
    }

    // 3. Pagination calculation
    const skip = (page - 1) * limit;

    // 4. Search filter
    const searchFilter = {
      isDeleted: false,

      // User can search:
      // - own documents
      // - public documents
      // - documents shared with them
      $or: [
        { owner: req.user.userId },
        { visibility: 'public' },
        { 'collaborators.user': req.user.userId },
      ],

        // Search in text OR AI keywords
        $and: [
            {
            $or: [
                { $text: { $search: q } },
                { aiKeywords: { $regex: q, $options: 'i' } },
            ],
            },
        ],
    };

    // 5. Execute search
    const documents = await Document.find(
      searchFilter,
      {
        score: { $meta: 'textScore' },
      }
    )
      .populate('owner', 'name email')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

    // 6. Total count for pagination
    const total = await Document.countDocuments(searchFilter);

    // 7. Send response
    res.json({
      query: q,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      results: documents,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
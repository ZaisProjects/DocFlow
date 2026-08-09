import Document from '../models/Document.js';

// Check whether current user can access a document
const canAccess = (document, userId) => {
  // Owner can always access
  if (document.owner._id.toString() === userId) {
    return true;
  }

  // Collaborators can access
  return document.collaborators.some(
    collaborator => collaborator.user.toString() === userId
  );
};

// CREATE DOCUMENT
export const createDocument = async (req, res) => {
  try {
    // Read data sent by client
    const { title, content } = req.body;

    // Create document in MongoDB
    const document = await Document.create({
      title: title || 'Untitled',
      content: content || '',
      owner: req.user.userId,
      lastEditedBy: req.user.userId,
    });

    // Send created document back to client
    res.status(201).json(document);
  } 
  catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET MY DOCUMENTS 
export const getDocuments = async (req, res) => { 
    try {

    // Find documents owned by current user 
    const documents = await Document.find({ 
        owner: req.user.userId, 
        isDeleted: false, 
    }).sort({ updatedAt: -1 }); 
    
        res.json({documents}); 
    } 
    catch (error) { 
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message, 
        }); 
    } 
};

// GET SINGLE DOCUMENT
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    // Document not found
    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }
    console.log('Document owner:', document.owner.toString());
    console.log('Current user :', req.user.userId);

    // Access control
    if (!canAccess(document, req.user.userId)) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    // Increase view count
    document.viewCount += 1;
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// UPDATE DOCUMENT
export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    // Document not found
    if (!document || document.isDeleted) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Check edit permission
    if (document.owner.toString() !== req.user.userId) {
      const collaborator = document.collaborators.find(
        c => c.user.toString() === req.user.userId
      );

      if (!collaborator || collaborator.role !== 'editor') {
        return res.status(403).json({
          message: 'Edit access denied',
        });
      }
    }

    // Update only provided fields
    if (req.body.title !== undefined) {
      document.title = req.body.title;
    }

    if (req.body.content !== undefined) {
      document.content = req.body.content;
    }

    if (req.body.visibility !== undefined) {
      document.visibility = req.body.visibility;
    }

    // Audit fields
    document.lastEditedBy = req.user.userId;
    document.lastEditedAt = new Date();

    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({
      message: 'Server Error',
      error: error.message,
    });
  }
};

// TOGGLE FAVORITE
export const toggleFavorite = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Toggle the value
    document.isFavorite = !document.isFavorite;

    await document.save();

    res.json({
      message: document.isFavorite
        ? 'Document added to favorites'
        : 'Document removed from favorites',
      isFavorite: document.isFavorite,
      documentId: document._id,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// MOVE DOCUMENT TO TRASH
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Soft delete
    document.isDeleted = true;
    document.deletedAt = new Date();

    await document.save();

    res.json({
      message: 'Document moved to trash',
      documentId: document._id,
      deletedAt: document.deletedAt,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET TRASHED DOCUMENTS
export const getTrashDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      owner: req.user.userId,
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// RESTORE DOCUMENT
export const restoreDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
      isDeleted: true,
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found in trash',
      });
    }

    document.isDeleted = false;
    document.deletedAt = null;

    await document.save();

    res.json({
      message: 'Document restored successfully',
      documentId: document._id,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
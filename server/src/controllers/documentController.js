import Document from '../models/Document.js';
import User from '../models/User.js';

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

// SHARE DOCUMENT
export const shareDocument = async (req, res) => {
  try {
    const { email, role = 'editor' } = req.body;

    // Find the user to share with
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Find document owned by current user
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Prevent sharing with yourself
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        message: 'You already own this document',
      });
    }

    // Prevent duplicate collaborators
    const alreadyCollaborator = document.collaborators.some(
      c => c.user.toString() === user._id.toString()
    );

    if (alreadyCollaborator) {
      return res.status(400).json({
        message: 'User is already a collaborator',
      });
    }

    // Add collaborator
    document.collaborators.push({
      user: user._id,
      role,
    });

    await document.save();

    res.status(201).json({
      message: 'Document shared successfully',
      collaborator: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET COLLABORATORS
export const getCollaborators = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    }).populate('collaborators.user', 'name email');

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    res.json(document.collaborators);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// REMOVE COLLABORATOR
export const removeCollaborator = async (req, res) => {
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

    // Find collaborator index
    const collaboratorIndex = document.collaborators.findIndex(
      c => c.user.toString() === req.params.userId
    );

    if (collaboratorIndex === -1) {
      return res.status(404).json({
        message: 'Collaborator not found',
      });
    }

    // Save collaborator BEFORE removing
    const removedCollaborator =
      document.collaborators[collaboratorIndex];

    // Remove collaborator
    document.collaborators.splice(collaboratorIndex, 1);

    await document.save();

    res.json({
      message: 'Collaborator removed successfully',
      removedCollaborator: {
        userId: removedCollaborator.user,
        role: removedCollaborator.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GENERATE PUBLIC SHARE LINK
export const generatePublicLink = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Make document public
    document.visibility = 'public';

    await document.save();

    res.json({
      message: 'Public link generated successfully',
      shareLink: document.shareLink,
      publicUrl: `${req.protocol}://${req.get('host')}/api/public/${document.shareLink}`,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET DOCUMENT BY PUBLIC SHARE LINK
export const getPublicDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareLink: req.params.shareLink,
      visibility: 'public',
      isDeleted: false,
    })
      .populate('owner', 'name email')
      .select('-collaborators');

    if (!document) {
      return res.status(404).json({
        message: 'Public document not found',
      });
    }

    // Count public views too
    document.viewCount += 1;
    await document.save();

    res.json({
      _id: document._id,
      title: document.title,
      content: document.content,
      owner: document.owner,
      visibility: document.visibility,
      viewCount: document.viewCount,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
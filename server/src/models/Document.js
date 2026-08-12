import mongoose from 'mongoose';
import crypto from 'crypto';

// Sub-schema for collaborators
const collaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'editor',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Main document schema
const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },

    content: {
      type: String,
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    collaborators: [collaboratorSchema],

    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
      index: true,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    lastEditedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    aiSummary: {
      type: String,
      default: '',
    },

    aiKeywords: [String],

    viewCount: {
      type: Number,
      default: 0,
    },

    shareLink: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomUUID(),
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------------------------
// SEARCH INDEXES
// --------------------------------------------------

// Full-text search on title + content
documentSchema.index({
  title: 'text',
  content: 'text',
});

// Fast dashboard query:
// owner + not deleted + recently updated
documentSchema.index({
  owner: 1,
  isDeleted: 1,
  updatedAt: -1,
});

// Fast public/shared listing
documentSchema.index({
  visibility: 1,
  updatedAt: -1,
});

// Fast AI keyword search
documentSchema.index({
  aiKeywords: 1,
});


export default mongoose.model('Document', documentSchema);
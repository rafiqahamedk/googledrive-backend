const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  s3Key: {
    type: String,
    required: true,
    unique: true
  },
  s3Url: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  path: {
    type: String,
    default: '/'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  starredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ owner: 1, folder: 1, isDeleted: 1 });
fileSchema.index({ owner: 1, isStarred: 1, isDeleted: 1 });
fileSchema.index({ s3Key: 1 });

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  return this.s3Url;
});

// Method to soft delete
fileSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to toggle starred
fileSchema.methods.toggleStarred = function() {
  this.isStarred = !this.isStarred;
  this.starredAt = this.isStarred ? new Date() : null;
  return this.save();
};

module.exports = mongoose.model('File', fileSchema);
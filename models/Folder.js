const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
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
folderSchema.index({ owner: 1, parent: 1, isDeleted: 1 });
folderSchema.index({ owner: 1, path: 1 });
folderSchema.index({ owner: 1, isStarred: 1, isDeleted: 1 });

// Prevent duplicate folder names in the same directory
folderSchema.index({ 
  owner: 1, 
  parent: 1, 
  name: 1, 
  isDeleted: 1 
}, { 
  unique: true,
  partialFilterExpression: { isDeleted: false }
});

// Method to get full path
folderSchema.methods.getFullPath = async function() {
  if (!this.parent) return `/${this.name}`;
  
  const parent = await this.constructor.findById(this.parent);
  const parentPath = await parent.getFullPath();
  return `${parentPath}/${this.name}`;
};

// Method to soft delete
folderSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to toggle starred
folderSchema.methods.toggleStarred = function() {
  this.isStarred = !this.isStarred;
  this.starredAt = this.isStarred ? new Date() : null;
  return this.save();
};

// Pre-save middleware to update path
folderSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('parent') || this.isModified('name')) {
    try {
      this.path = await this.getFullPath();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Folder', folderSchema);
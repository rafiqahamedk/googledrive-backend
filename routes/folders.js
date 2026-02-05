const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const crypto = require('crypto');
const Folder = require('../models/Folder');
const File = require('../models/File');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { deleteFromS3, s3 } = require('../config/aws');

const router = express.Router();

// @route   POST /api/folders
// @desc    Create folder
// @access  Private
router.post('/', protect, [
  body('name').trim().isLength({ min: 1 }).withMessage('Folder name is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, parentId } = req.body;
    let parent = null;

    // Validate parent folder if provided
    if (parentId) {
      parent = await Folder.findOne({
        _id: parentId,
        owner: req.user._id,
        isDeleted: false
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    // Check for duplicate folder name in the same directory
    const existingFolder = await Folder.findOne({
      name: name.trim(),
      parent: parent ? parent._id : null,
      owner: req.user._id,
      isDeleted: false
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'A folder with this name already exists in this location'
      });
    }

    // Create folder
    const folder = new Folder({
      name: name.trim(),
      owner: req.user._id,
      parent: parent ? parent._id : null
    });

    await folder.save();
    await folder.populate('parent', 'name path');

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: {
        folder: {
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Folder creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating folder'
    });
  }
});

// @route   GET /api/folders/starred
// @desc    Get starred folders
// @access  Private
router.get('/starred', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {
      owner: req.user._id,
      isDeleted: false,
      isStarred: true
    };

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const folders = await Folder.find(query)
      .populate('parent', 'name path')
      .sort({ starredAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Folder.countDocuments(query);

    res.json({
      success: true,
      data: {
        folders: folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          isStarred: folder.isStarred,
          starredAt: folder.starredAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get starred folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting starred folders'
    });
  }
});

// @route   GET /api/folders/trash
// @desc    Get deleted folders
// @access  Private
router.get('/trash', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {
      owner: req.user._id,
      isDeleted: true
    };

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const folders = await Folder.find(query)
      .populate('parent', 'name path')
      .sort({ deletedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Folder.countDocuments(query);

    res.json({
      success: true,
      data: {
        folders: folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          deletedAt: folder.deletedAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get trash folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting trash folders'
    });
  }
});

// @route   GET /api/folders
// @desc    Get user folders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { parentId, page = 1, limit = 20, search } = req.query;
    
    const query = {
      owner: req.user._id,
      isDeleted: false
    };

    // Filter by parent folder
    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null; // Root folders
    }

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const folders = await Folder.find(query)
      .populate('parent', 'name path')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Folder.countDocuments(query);

    res.json({
      success: true,
      data: {
        folders: folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          isStarred: folder.isStarred,
          starredAt: folder.starredAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting folders'
    });
  }
});

// @route   GET /api/folders/:id
// @desc    Get folder details with contents
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    }).populate('parent', 'name path');

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Get subfolders
    const subfolders = await Folder.find({
      parent: folder._id,
      owner: req.user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    // Get files in this folder
    const files = await File.find({
      folder: folder._id,
      owner: req.user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        folder: {
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        },
        contents: {
          folders: subfolders.map(subfolder => ({
            id: subfolder._id,
            name: subfolder.name,
            path: subfolder.path,
            createdAt: subfolder.createdAt,
            updatedAt: subfolder.updatedAt
          })),
          files: files.map(file => ({
            id: file._id,
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting folder'
    });
  }
});

// @route   PUT /api/folders/:id/rename
// @desc    Rename folder
// @access  Private
router.put('/:id/rename', protect, [
  body('name').trim().isLength({ min: 1 }).withMessage('Folder name is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name } = req.body;

    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Check for duplicate folder name in the same directory
    const existingFolder = await Folder.findOne({
      name: name.trim(),
      parent: folder.parent,
      owner: req.user._id,
      isDeleted: false,
      _id: { $ne: folder._id }
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'A folder with this name already exists in this location'
      });
    }

    folder.name = name.trim();
    await folder.save();

    // Update paths for all subfolders and files
    await updateChildrenPaths(folder._id);

    res.json({
      success: true,
      message: 'Folder renamed successfully',
      data: {
        folder: {
          id: folder._id,
          name: folder.name,
          path: folder.path,
          updatedAt: folder.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Folder rename error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error renaming folder'
    });
  }
});

// @route   PUT /api/folders/:id/move
// @desc    Move folder to different parent
// @access  Private
router.put('/:id/move', protect, async (req, res) => {
  try {
    const { parentId } = req.body;
    let targetParent = null;

    // Validate target parent if provided
    if (parentId) {
      targetParent = await Folder.findOne({
        _id: parentId,
        owner: req.user._id,
        isDeleted: false
      });

      if (!targetParent) {
        return res.status(404).json({
          success: false,
          message: 'Target parent folder not found'
        });
      }
    }

    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Prevent moving folder into itself or its descendants
    if (targetParent && await isDescendant(folder._id, targetParent._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move folder into itself or its descendants'
      });
    }

    // Check for duplicate folder name in target location
    const existingFolder = await Folder.findOne({
      name: folder.name,
      parent: targetParent ? targetParent._id : null,
      owner: req.user._id,
      isDeleted: false,
      _id: { $ne: folder._id }
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'A folder with this name already exists in the target location'
      });
    }

    // Update folder parent
    folder.parent = targetParent ? targetParent._id : null;
    await folder.save();

    // Update paths for this folder and all its children
    await updateChildrenPaths(folder._id);

    await folder.populate('parent', 'name path');

    res.json({
      success: true,
      message: 'Folder moved successfully',
      data: {
        folder: {
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          updatedAt: folder.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Folder move error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error moving folder'
    });
  }
});

// @route   DELETE /api/folders/:id
// @desc    Delete folder and all its contents (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Recursively soft delete folder and all its contents
    await deleteFolderRecursively(folder._id, req.user._id);

    res.json({
      success: true,
      message: 'Folder and all its contents moved to trash successfully'
    });
  } catch (error) {
    console.error('Folder delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting folder'
    });
  }
});

// @route   GET /api/folders/breadcrumb/:id
// @desc    Get folder breadcrumb path
// @access  Private
router.get('/breadcrumb/:id', protect, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    const breadcrumb = await getBreadcrumb(folder);

    res.json({
      success: true,
      data: {
        breadcrumb
      }
    });
  } catch (error) {
    console.error('Get breadcrumb error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting breadcrumb'
    });
  }
});

// @route   PUT /api/folders/:id/star
// @desc    Toggle folder starred status
// @access  Private
router.put('/:id/star', protect, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    await folder.toggleStarred();

    res.json({
      success: true,
      message: folder.isStarred ? 'Folder starred successfully' : 'Folder unstarred successfully',
      data: {
        folder: {
          id: folder._id,
          name: folder.name,
          isStarred: folder.isStarred,
          starredAt: folder.starredAt,
          updatedAt: folder.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Folder star error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating folder starred status'
    });
  }
});

// @route   GET /api/folders/starred
// @desc    Get starred folders
// @access  Private
router.get('/starred', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {
      owner: req.user._id,
      isDeleted: false,
      isStarred: true
    };

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const folders = await Folder.find(query)
      .populate('parent', 'name path')
      .sort({ starredAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Folder.countDocuments(query);

    res.json({
      success: true,
      data: {
        folders: folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          isStarred: folder.isStarred,
          starredAt: folder.starredAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get starred folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting starred folders'
    });
  }
});

// @route   GET /api/folders/trash
// @desc    Get deleted folders
// @access  Private
router.get('/trash', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {
      owner: req.user._id,
      isDeleted: true
    };

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const folders = await Folder.find(query)
      .populate('parent', 'name path')
      .sort({ deletedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Folder.countDocuments(query);

    res.json({
      success: true,
      data: {
        folders: folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          parent: folder.parent,
          path: folder.path,
          deletedAt: folder.deletedAt,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get trash folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting trash folders'
    });
  }
});

// @route   PUT /api/folders/:id/restore
// @desc    Restore folder from trash
// @access  Private
router.put('/:id/restore', protect, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: true
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found in trash'
      });
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    res.json({
      success: true,
      message: 'Folder restored successfully',
      data: {
        folder: {
          id: folder._id,
          name: folder.name,
          isDeleted: folder.isDeleted,
          updatedAt: folder.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Folder restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error restoring folder'
    });
  }
});

// @route   DELETE /api/folders/:id/permanent
// @desc    Permanently delete folder and all contents
// @access  Private
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: true
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found in trash'
      });
    }

    // Permanently delete folder and all its contents
    await permanentlyDeleteFolderRecursively(folder._id, req.user._id);

    res.json({
      success: true,
      message: 'Folder and all its contents permanently deleted'
    });
  } catch (error) {
    console.error('Folder permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error permanently deleting folder'
    });
  }
});

// @route   POST /api/folders/:id/copy
// @desc    Copy folder
// @access  Private
router.post('/:id/copy', protect, async (req, res) => {
  try {
    const { parentId, name } = req.body;
    
    const originalFolder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!originalFolder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    let targetParent = null;
    if (parentId) {
      targetParent = await Folder.findOne({
        _id: parentId,
        owner: req.user._id,
        isDeleted: false
      });

      if (!targetParent) {
        return res.status(404).json({
          success: false,
          message: 'Target parent folder not found'
        });
      }
    }

    // Create new folder
    const newFolderName = name || `Copy of ${originalFolder.name}`;
    const copiedFolder = new Folder({
      name: newFolderName,
      owner: req.user._id,
      parent: targetParent ? targetParent._id : null
    });

    await copiedFolder.save();

    // Recursively copy contents
    await copyFolderContentsRecursively(originalFolder._id, copiedFolder._id, req.user._id);

    await copiedFolder.populate('parent', 'name path');

    res.status(201).json({
      success: true,
      message: 'Folder copied successfully',
      data: {
        folder: {
          id: copiedFolder._id,
          name: copiedFolder.name,
          parent: copiedFolder.parent,
          path: copiedFolder.path,
          createdAt: copiedFolder.createdAt,
          updatedAt: copiedFolder.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Folder copy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error copying folder'
    });
  }
});

// Helper function to check if a folder is a descendant of another
async function isDescendant(folderId, potentialAncestorId) {
  if (folderId.toString() === potentialAncestorId.toString()) {
    return true;
  }

  const folder = await Folder.findById(folderId);
  if (!folder || !folder.parent) {
    return false;
  }

  return await isDescendant(folder.parent, potentialAncestorId);
}

// Helper function to update paths for all children
async function updateChildrenPaths(folderId) {
  const folder = await Folder.findById(folderId);
  if (!folder) return;

  // Update all subfolders
  const subfolders = await Folder.find({ parent: folderId, isDeleted: false });
  for (const subfolder of subfolders) {
    await subfolder.save(); // This will trigger the pre-save middleware to update path
    await updateChildrenPaths(subfolder._id); // Recursively update children
  }

  // Update all files in this folder
  await File.updateMany(
    { folder: folderId, isDeleted: false },
    { path: folder.path }
  );
}

// Helper function to recursively soft delete folder and contents
async function deleteFolderRecursively(folderId, userId) {
  // Get all subfolders
  const subfolders = await Folder.find({
    parent: folderId,
    owner: userId,
    isDeleted: false
  });

  // Recursively delete subfolders
  for (const subfolder of subfolders) {
    await deleteFolderRecursively(subfolder._id, userId);
  }

  // Get all files in this folder
  const files = await File.find({
    folder: folderId,
    owner: userId,
    isDeleted: false
  });

  // Soft delete files (move to trash)
  for (const file of files) {
    await file.softDelete();
  }

  // Soft delete folder (move to trash)
  const folder = await Folder.findById(folderId);
  if (folder) {
    await folder.softDelete();
  }
}

// Helper function to permanently delete folder and contents
async function permanentlyDeleteFolderRecursively(folderId, userId) {
  // Get all subfolders
  const subfolders = await Folder.find({
    parent: folderId,
    owner: userId,
    isDeleted: true
  });

  // Recursively delete subfolders
  for (const subfolder of subfolders) {
    await permanentlyDeleteFolderRecursively(subfolder._id, userId);
  }

  // Get all files in this folder
  const files = await File.find({
    folder: folderId,
    owner: userId,
    isDeleted: true
  });

  // Delete files from S3 and database
  for (const file of files) {
    await deleteFromS3(file.s3Key);
    // Update user storage
    await User.findByIdAndUpdate(userId, {
      $inc: { storageUsed: -file.size }
    });
    await File.findByIdAndDelete(file._id);
  }

  // Permanently delete folder from database
  await Folder.findByIdAndDelete(folderId);
}

// Helper function to copy folder contents recursively
async function copyFolderContentsRecursively(sourceFolderId, targetFolderId, userId) {
  // Copy subfolders
  const subfolders = await Folder.find({
    parent: sourceFolderId,
    owner: userId,
    isDeleted: false
  });

  for (const subfolder of subfolders) {
    const newSubfolder = new Folder({
      name: subfolder.name,
      owner: userId,
      parent: targetFolderId
    });
    await newSubfolder.save();
    
    // Recursively copy contents of this subfolder
    await copyFolderContentsRecursively(subfolder._id, newSubfolder._id, userId);
  }

  // Copy files
  const files = await File.find({
    folder: sourceFolderId,
    owner: userId,
    isDeleted: false
  });

  for (const file of files) {
    // Generate new S3 key for the copy
    const newS3Key = `files/${userId}/${crypto.randomBytes(16).toString('hex')}-${Date.now()}${path.extname(file.originalName)}`;
    
    try {
      // Copy file in S3
      const copyParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        CopySource: `${process.env.S3_BUCKET_NAME}/${file.s3Key}`,
        Key: newS3Key
      };

      await s3.copyObject(copyParams).promise();
      const newS3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newS3Key}`;

      // Create new file record
      const copiedFile = new File({
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        s3Key: newS3Key,
        s3Url: newS3Url,
        owner: userId,
        folder: targetFolderId,
        path: (await Folder.findById(targetFolderId)).path
      });

      await copiedFile.save();

      // Update user storage
      await User.findByIdAndUpdate(userId, {
        $inc: { storageUsed: file.size }
      });
    } catch (error) {
      console.error(`Error copying file ${file.name}:`, error);
    }
  }
}

// Helper function to get breadcrumb path
async function getBreadcrumb(folder) {
  const breadcrumb = [];
  let current = folder;

  while (current) {
    breadcrumb.unshift({
      id: current._id,
      name: current.name,
      path: current.path
    });

    if (current.parent) {
      current = await Folder.findById(current.parent);
    } else {
      break;
    }
  }

  // Add root folder
  breadcrumb.unshift({
    id: null,
    name: 'My Drive',
    path: '/'
  });

  return breadcrumb;
}

module.exports = router;
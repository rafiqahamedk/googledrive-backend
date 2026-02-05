const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const File = require('../models/File');
const User = require('../models/User');
const Folder = require('../models/Folder');
const { protect } = require('../middleware/auth');
const { s3, generateSignedUrl, deleteFromS3 } = require('../config/aws');

const router = express.Router();

// Configure multer for memory storage (we'll upload to S3 manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types but exclude potentially dangerous ones
    const dangerousTypes = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (dangerousTypes.includes(fileExt)) {
      return cb(new Error('File type not allowed for security reasons'));
    }
    
    cb(null, true);
  }
});

// @route   POST /api/files/upload
// @desc    Upload file
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { folderId } = req.body;
    let folder = null;

    // Validate folder if provided
    if (folderId) {
      folder = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isDeleted: false
      });

      if (!folder) {
        return res.status(400).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    // Generate unique key for S3
    const uniqueKey = `files/${req.user._id}/${crypto.randomBytes(16).toString('hex')}-${Date.now()}${path.extname(req.file.originalname)}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: uniqueKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user._id.toString(),
        uploadedAt: new Date().toISOString()
      }
    };

    const s3Result = await s3.upload(uploadParams).promise();

    // Create file record
    const file = new File({
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      s3Key: uniqueKey,
      s3Url: s3Result.Location,
      owner: req.user._id,
      folder: folder ? folder._id : null,
      path: folder ? folder.path : '/'
    });

    await file.save();

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: req.file.size }
    });

    // Populate folder info for response
    await file.populate('folder', 'name path');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: {
          id: file._id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          folder: file.folder,
          path: file.path,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during file upload'
    });
  }
});

// @route   GET /api/files/starred
// @desc    Get starred files
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

    const files = await File.find(query)
      .populate('folder', 'name path')
      .sort({ starredAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: {
        files: files.map(file => ({
          id: file._id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          folder: file.folder,
          path: file.path,
          isStarred: file.isStarred,
          starredAt: file.starredAt,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get starred files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting starred files'
    });
  }
});

// @route   GET /api/files/trash
// @desc    Get deleted files
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

    const files = await File.find(query)
      .populate('folder', 'name path')
      .sort({ deletedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: {
        files: files.map(file => ({
          id: file._id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          folder: file.folder,
          path: file.path,
          deletedAt: file.deletedAt,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get trash files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting trash files'
    });
  }
});

// @route   GET /api/files
// @desc    Get user files
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { folderId, page = 1, limit = 20, search } = req.query;
    
    const query = {
      owner: req.user._id,
      isDeleted: false
    };

    // Filter by folder
    if (folderId) {
      query.folder = folderId;
    } else {
      query.folder = null; // Root folder
    }

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const files = await File.find(query)
      .populate('folder', 'name path')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: {
        files: files.map(file => ({
          id: file._id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          folder: file.folder,
          path: file.path,
          isStarred: file.isStarred,
          starredAt: file.starredAt,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting files'
    });
  }
});

// @route   GET /api/files/:id/download
// @desc    Download file
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Generate signed URL for download
    const downloadUrl = generateSignedUrl(file.s3Key, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType
      }
    });
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating download link'
    });
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete file (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Soft delete the file (move to trash)
    await file.softDelete();

    res.json({
      success: true,
      message: 'File moved to trash successfully'
    });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting file'
    });
  }
});

// @route   PUT /api/files/:id/rename
// @desc    Rename file
// @access  Private
router.put('/:id/rename', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }

    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    file.name = name.trim();
    await file.save();

    res.json({
      success: true,
      message: 'File renamed successfully',
      data: {
        file: {
          id: file._id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          updatedAt: file.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('File rename error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error renaming file'
    });
  }
});

// @route   PUT /api/files/:id/move
// @desc    Move file to different folder
// @access  Private
router.put('/:id/move', protect, async (req, res) => {
  try {
    const { folderId } = req.body;
    let targetFolder = null;

    // Validate target folder if provided
    if (folderId) {
      targetFolder = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isDeleted: false
      });

      if (!targetFolder) {
        return res.status(404).json({
          success: false,
          message: 'Target folder not found'
        });
      }
    }

    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Update file location
    file.folder = targetFolder ? targetFolder._id : null;
    file.path = targetFolder ? targetFolder.path : '/';
    await file.save();

    await file.populate('folder', 'name path');

    res.json({
      success: true,
      message: 'File moved successfully',
      data: {
        file: {
          id: file._id,
          name: file.name,
          folder: file.folder,
          path: file.path,
          updatedAt: file.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('File move error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error moving file'
    });
  }
});

// @route   PUT /api/files/:id/star
// @desc    Toggle file starred status
// @access  Private
router.put('/:id/star', protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    await file.toggleStarred();

    res.json({
      success: true,
      message: file.isStarred ? 'File starred successfully' : 'File unstarred successfully',
      data: {
        file: {
          id: file._id,
          name: file.name,
          isStarred: file.isStarred,
          starredAt: file.starredAt,
          updatedAt: file.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('File star error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating file starred status'
    });
  }
});

// @route   PUT /api/files/:id/restore
// @desc    Restore file from trash
// @access  Private
router.put('/:id/restore', protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash'
      });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json({
      success: true,
      message: 'File restored successfully',
      data: {
        file: {
          id: file._id,
          name: file.name,
          isDeleted: file.isDeleted,
          updatedAt: file.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('File restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error restoring file'
    });
  }
});

// @route   DELETE /api/files/:id/permanent
// @desc    Permanently delete file
// @access  Private
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash'
      });
    }

    // Delete from S3
    const s3Deleted = await deleteFromS3(file.s3Key);
    if (!s3Deleted) {
      console.warn(`Failed to delete file from S3: ${file.s3Key}`);
    }

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -file.size }
    });

    // Permanently delete from database
    await File.findByIdAndDelete(file._id);

    res.json({
      success: true,
      message: 'File permanently deleted'
    });
  } catch (error) {
    console.error('File permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error permanently deleting file'
    });
  }
});

// @route   POST /api/files/:id/copy
// @desc    Copy file
// @access  Private
router.post('/:id/copy', protect, async (req, res) => {
  try {
    const { folderId, name } = req.body;
    
    const originalFile = await File.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false
    });

    if (!originalFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    let targetFolder = null;
    if (folderId) {
      targetFolder = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isDeleted: false
      });

      if (!targetFolder) {
        return res.status(404).json({
          success: false,
          message: 'Target folder not found'
        });
      }
    }

    // Generate new S3 key for the copy
    const newS3Key = `files/${req.user._id}/${crypto.randomBytes(16).toString('hex')}-${Date.now()}${path.extname(originalFile.originalName)}`;
    
    // Copy file in S3
    const copyParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      CopySource: `${process.env.S3_BUCKET_NAME}/${originalFile.s3Key}`,
      Key: newS3Key
    };

    const s3Result = await s3.copyObject(copyParams).promise();
    const newS3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newS3Key}`;

    // Create new file record
    const newFileName = name || `Copy of ${originalFile.name}`;
    const copiedFile = new File({
      name: newFileName,
      originalName: originalFile.originalName,
      mimeType: originalFile.mimeType,
      size: originalFile.size,
      s3Key: newS3Key,
      s3Url: newS3Url,
      owner: req.user._id,
      folder: targetFolder ? targetFolder._id : null,
      path: targetFolder ? targetFolder.path : '/'
    });

    await copiedFile.save();

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: originalFile.size }
    });

    await copiedFile.populate('folder', 'name path');

    res.status(201).json({
      success: true,
      message: 'File copied successfully',
      data: {
        file: {
          id: copiedFile._id,
          name: copiedFile.name,
          size: copiedFile.size,
          mimeType: copiedFile.mimeType,
          folder: copiedFile.folder,
          path: copiedFile.path,
          createdAt: copiedFile.createdAt,
          updatedAt: copiedFile.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('File copy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error copying file'
    });
  }
});

module.exports = router;
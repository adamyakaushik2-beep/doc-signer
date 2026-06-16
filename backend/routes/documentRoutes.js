const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/Document');
const { protect } = require('../middleware/authMiddleware'); // 1. Import protection middleware

// Configure Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF documents are allowed!'), false);
};

const upload = multer({ storage, fileFilter });

// 2. Add the 'protect' middleware right before your upload function handler
router.post('/upload', protect, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 3. Extract the real User ID injected by our middleware
    const newDoc = await Document.create({
      title: req.body.title || req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.user._id // No more hardcoding!
    });

    res.status(201).json({ message: 'Document uploaded successfully!', document: newDoc });
  } catch (error) {
    console.error('❌ Secure Upload Route Error:', error);
    res.status(500).json({ message: 'Server error during secure file upload' });
  }
});

// 4. NEW ENDPOINT: Fetch all documents belonging to the authenticated user
router.get('/my-docs', protect, async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('❌ Fetch Documents Error:', error);
    res.status(500).json({ message: 'Failed to retrieve user documents' });
  }
});

module.exports = router;
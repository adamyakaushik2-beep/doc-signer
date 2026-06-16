const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');

// 1. Configure how Multer stores uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Saves files into your backend/uploads/ folder
  },
  filename: (req, file, cb) => {
    // Generates a unique name: timestamp-originalfilename.pdf
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// 2. File filter to ensure ONLY PDFs are accepted
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// 3. The Upload Endpoint (Temporary placeholder for uploadedBy ID for testing)
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file format invalid' });
    }

    // Create a new database record for the file
    const newDoc = await Document.create({
      title: req.body.title || req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.body.userId // We will link this automatically using auth middleware tomorrow
    });

    res.status(201).json({ message: 'Document uploaded successfully!', document: newDoc });
  } catch (error) {
    console.error('❌ Upload Route Error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

module.exports = router;
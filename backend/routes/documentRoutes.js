const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/Document');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 1. UPDATED: Secure upload route that captures recipient invitations
router.post('/upload', protect, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Parse incoming recipient emails (sent as a comma-separated string or array)
    let recipientArray = [];
    if (req.body.recipients) {
      recipientArray = req.body.recipients.split(',').map(email => email.trim().toLowerCase());
    }

    const newDoc = await Document.create({
      title: req.body.title || req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.user._id,
      recipients: recipientArray // Save invited signers
    });

    res.status(201).json({ message: 'Document tracking initiated!', document: newDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during collaborative upload setup' });
  }
});

// 2. UPDATED: Fetch split dashboard feeds (Owned vs Invited)
router.get('/my-docs', protect, async (req, res) => {
  try {
    // Feed A: Documents created by this user
    const ownedDocs = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });

    // Feed B: Documents where this user's email is listed in the recipients array
    const absoluteEmail = req.user.email.toLowerCase();
    const pendingInboundDocs = await Document.find({ 
      recipients: absoluteEmail,
      'signatures.email': { $ne: absoluteEmail } // Exclude if they already signed it
    }).sort({ createdAt: -1 });

    res.json({ ownedDocs, pendingInboundDocs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to sync workspace feeds' });
  }
});

module.exports = router;
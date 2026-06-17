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


const fs = require('fs');
const { PDFDocument } = require('pdf-lib'); // Import the PDF editor tool

// Endpoint to programmatically stamp a signature onto a PDF file
router.post('/:id/sign', protect, async (req, res) => {
  try {
    const { signatureImage } = req.body; // Base64 string from frontend canvas
    if (!signatureImage) {
      return res.status(400).json({ message: 'Signature drawing data is required' });
    }

    // 1. Locate the document metadata record in MongoDB
    const docRecord = await Document.findById(req.id || req.params.id);
    if (!docRecord) {
      return res.status(404).json({ message: 'Document file record not found' });
    }

    // 2. Read the physical PDF file from your local drive storage folder
    const pdfBytes = fs.readFileSync(docRecord.filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the first page of your PDF file to apply the stamp
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // 3. Convert the incoming Base64 image string into a raw binary buffer
    const base64Data = signatureImage.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, 'base64');
    
    // Embed the raw binary signature image asset into the PDF matrix
    const embeddedImage = await pdfDoc.embedPng(imgBuffer);

    // 4. Draw the signature image on the bottom-right coordinate plane of the PDF page
    firstPage.drawImage(embeddedImage, {
      x: firstPage.getWidth() - 170, // Coordinate alignment tracking offsets
      y: 40,
      width: 130,
      height: 60,
    });

    // 5. Overwrite the physical file on your disk with the updated binary block
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(docRecord.filePath, modifiedPdfBytes);

    // 6. Update document status metrics inside MongoDB
    docRecord.status = 'Signed';
    docRecord.signatures.push({
      userId: req.user._id,
      signedAt: new Date()
    });
    await docRecord.save();

    res.json({ message: 'Document signed and processed successfully!', document: docRecord });
  } catch (error) {
    console.error('❌ PDF Stamping Route Failure:', error);
    res.status(500).json({ message: 'Internal server error processing PDF signature matrix' });
  }
});

module.exports = router;
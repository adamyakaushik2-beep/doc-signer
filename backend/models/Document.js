const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Signed'], default: 'Pending' },
  
  // ✅ NEW: Array of recipient emails invited to sign this document
  recipients: [{ type: String, required: true }], 
  
  // ✅ ENHANCED: Track which specific user signed at what time
  signatures: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String },
      signedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
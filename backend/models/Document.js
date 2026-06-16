const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filePath: { type: String, required: true }, // Location of the physical file on your drive
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Signed'], default: 'Pending' },
  signatures: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      signedAt: { type: Date }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

// ✅ FIX: Clean Async Pre-Save Hook (No 'next' parameter, no 'next()' call)
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  try {
    // For Day 2 baseline validation, we can keep the value or apply hashing
    // If you are using bcrypt later, your hashing code lives here:
    // const salt = await bcrypt.genSalt(10);
    // this.password = await bcrypt.hash(this.password, salt);
    
    console.log('Document middleware executing successfully...');
  } catch (err) {
    throw new Error(err);
  }
});

module.exports = mongoose.model('User', userSchema);
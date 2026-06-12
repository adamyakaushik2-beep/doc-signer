require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Loads values from .env file

const authRoutes = require('./routes/authRoutes');

const app = express();

// Global Middleware
app.use(cors()); // Allows your React app on port 5173 to talk to this server
app.use(express.json()); // Essential: Parses raw JSON strings in incoming request bodies into JavaScript objects

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ Database Connection Error:', err));

// Route Mountings
app.use('/api/auth', authRoutes); // Any request starting with /api/auth goes to authRoutes

// Global Error Handler (Fallback if something breaks)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke on the server!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
const express = require('express');
const cors = require('cors'); // 1. Import CORS
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

dotenv.config();
const app = express();

// Connect to your D: drive local MongoDB
connectDB();

// 2. Enable CORS Middleware (Crucial: Must be placed BEFORE route definitions)
app.use(cors({
  origin: 'http://localhost:5173', // Allow your React app to connect
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connects using your local URI setup from yesterday
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1); // Stop the server if database connection fails
  }
};

module.exports = connectDB;
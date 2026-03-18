const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grocery-app';

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`  ✅  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('  ❌  MongoDB connection error:', err.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('  ⚠️  MongoDB disconnected');
});

module.exports = connectDB;

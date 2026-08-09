const mongoose = require('mongoose');

let isInMemoryMode = false;

const connectDB = async () => {
  const connString = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civic_welfare_db';
  try {
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB server (${error.message}). Using hybrid Memory Store mode for seamless demo.`);
    isInMemoryMode = true;
    return null;
  }
};

const checkInMemoryMode = () => isInMemoryMode || mongoose.connection.readyState !== 1;

module.exports = { connectDB, checkInMemoryMode };

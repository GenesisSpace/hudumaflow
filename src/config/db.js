const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast instead of hanging on a dead connection
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// These fire on the connection AFTER the initial connect succeeds —
// this is what was missing before, which is why failures after boot
// were producing no logs at all.
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error after initial connect:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected — driver will attempt to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

module.exports = connectDB;
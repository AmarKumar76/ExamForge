const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      throw new Error('MongoDB connection URI (MONGO_URI) is missing.');
    }

    let conn;
    try {
      conn = await mongoose.connect(config.mongoUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
      });
    } catch (primaryErr) {
      console.warn(`⚠️ Primary MongoDB Connection Failed (${primaryErr.message}). Trying local MongoDB fallback...`);
      try {
        conn = await mongoose.connect('mongodb://127.0.0.1:27017/examforge', {
          autoIndex: true,
          serverSelectionTimeoutMS: 3000,
        });
      } catch (localErr) {
        throw primaryErr;
      }
    }

    if (config.env !== 'test') {
      console.log(`✅ MongoDB Connected: ${conn.connection.host} [Database: ${conn.connection.name}]`);
    }

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Runtime Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB Disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    if (config.env !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (config.env !== 'test') {
      console.log('🔌 MongoDB connection closed gracefully.');
    }
  } catch (error) {
    console.error(`❌ Error closing MongoDB connection: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};

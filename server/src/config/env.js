const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback check for root level .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_fallback_jwt_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  superAdmin: {
    email: process.env.SUPERADMIN_EMAIL || 'amar766730@gmail.com',
    password: process.env.SUPERADMIN_PASSWORD || 'Amar@123',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || 'amar766730@gmail.com',
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'ExamForge System <amar766730@gmail.com>',
  },
};

if (!config.mongoUri && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ WARNING: MONGO_URI is not defined in environment variables.');
}

module.exports = config;

/**
 * Jest Global Setup File
 * Enforces NODE_ENV=test, sets MONGO_URI_TEST, and enforces safety guard
 */

process.env.NODE_ENV = 'test';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testMongoUri = process.env.MONGO_URI_TEST || process.env.TEST_MONGO_URI || (
  process.env.MONGO_URI
    ? process.env.MONGO_URI.replace(/\/examforge(\?|$)/i, '/examforge_test$1')
    : 'mongodb://127.0.0.1:27017/examforge_test'
);

process.env.MONGO_URI = testMongoUri;
process.env.MONGODB_URI = testMongoUri;

// SAFETY GUARD ASSERTION
const dbMatch = String(testMongoUri).toLowerCase().match(/\/([a-z0-9_-]+)(\?|$)/i);
const dbName = dbMatch ? dbMatch[1] : '';

if (dbName === 'examforge') {
  console.error('\n🔴 FATAL SAFETY GUARD: PREVENTED JEST TEST EXECUTION ON PRODUCTION DATABASE "examforge"!\n');
  process.exit(1);
}

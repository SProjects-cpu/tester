/**
 * Migration Script: Add DPIIT, Recognition Date, and Bhaskar ID fields
 * 
 * This script adds three new optional fields to the startup collection/table:
 * - dpiitNo: String - DPIIT (Department for Promotion of Industry and Internal Trade) Number
 * - recognitionDate: Date - Official recognition date
 * - bhaskarId: String - Bhaskar identification number
 * 
 * These fields are optional and won't affect existing data.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magic';

async function migrateMongoDBFields() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const startupsCollection = db.collection('startups');

    // Add new fields to all existing documents (set to empty string/null if not present)
    const result = await startupsCollection.updateMany(
      {
        $or: [
          { dpiitNo: { $exists: false } },
          { recognitionDate: { $exists: false } },
          { bhaskarId: { $exists: false } }
        ]
      },
      {
        $set: {
          dpiitNo: '',
          recognitionDate: '',
          bhaskarId: ''
        }
      }
    );

    console.log(`✓ MongoDB Migration completed successfully!`);
    console.log(`  - Documents matched: ${result.matchedCount}`);
    console.log(`  - Documents modified: ${result.modifiedCount}`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('MongoDB Migration failed:', error);
    process.exit(1);
  }
}

async function migratePostgreSQLFields() {
  console.log('\nFor PostgreSQL/Prisma:');
  console.log('Run the following commands:');
  console.log('  1. cd backend');
  console.log('  2. npx prisma migrate dev --name add_dpiit_fields');
  console.log('  3. npx prisma generate');
  console.log('\nThis will apply the schema changes and regenerate the Prisma client.');
}

// Run migrations
console.log('=== MAGIC Startup Fields Migration ===\n');
console.log('Adding new fields: dpiitNo, recognitionDate, bhaskarId\n');

const dbType = process.argv[2] || 'mongodb';

if (dbType === 'mongodb') {
  migrateMongoDBFields();
} else if (dbType === 'postgresql' || dbType === 'prisma') {
  migratePostgreSQLFields();
} else {
  console.log('Usage: node add-dpiit-fields.js [mongodb|postgresql]');
  console.log('\nExample:');
  console.log('  node add-dpiit-fields.js mongodb');
  console.log('  node add-dpiit-fields.js postgresql');
}

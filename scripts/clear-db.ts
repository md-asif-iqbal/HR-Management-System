import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-attendance';

async function clearDatabase() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  if (!mongoose.connection.db) {
    throw new Error('Database connection is not ready');
  }

  const dbName = mongoose.connection.db.databaseName;
  await mongoose.connection.db.dropDatabase();
  console.log(`🧹 Database cleared: ${dbName}`);

  await mongoose.disconnect();
  console.log('👋 Disconnected');
}

clearDatabase().catch(async (error) => {
  console.error('❌ Failed to clear database:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});

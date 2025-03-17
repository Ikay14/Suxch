import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export async function initializeDatabase() {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:10000/suxch';
    await mongoose.connect(dbUri, {
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1); 
  }
}

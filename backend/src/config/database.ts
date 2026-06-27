import mongoose from 'mongoose';
import { config } from './index';

export async function connectDatabase(): Promise<void> {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

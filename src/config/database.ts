import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Connect to MongoDB with retry logic
 */
export const connectDB = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGO_URI as string;

  if (!MONGO_URI) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(MONGO_URI, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error}`);
    process.exit(1);
  }
};

/**
 * Gracefully close MongoDB connection
 */
export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

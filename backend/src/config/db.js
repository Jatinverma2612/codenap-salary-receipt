import mongoose from 'mongoose';
import env from './env.js';

let listenersRegistered = false;

/**
 * Connects to the pre-created MongoDB database using MONGO_URI from environment config.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);

  if (!listenersRegistered) {
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection lost.');
    });

    listenersRegistered = true;
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    // Log only host and database name; never log MONGO_URI as it may contain credentials.
    console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    throw err;
  }
}

/**
 * Gracefully closes the active Mongoose connection.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

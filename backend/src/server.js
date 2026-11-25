import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

let server = null;

/**
 * Connects to MongoDB and starts the Express HTTP server.
 */
async function startServer() {
  try {
    await connectDB();

    // Bind explicitly to localhost/127.0.0.1 in non-production to avoid exposing local dev on 0.0.0.0.
    const host = env.isProduction ? undefined : '127.0.0.1';
    server = app.listen(env.port, host, () => {
      const displayHost = host || '0.0.0.0';
      console.log(`Codenap Receipt API listening on http://${displayHost}:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('Server startup aborted:', err.message);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the HTTP server and closes the MongoDB connection.
 */
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();

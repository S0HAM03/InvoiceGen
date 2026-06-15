import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const PORT = env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  await connectDB();

  // Start listening
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode at http://localhost:${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();

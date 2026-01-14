// Vercel serverless function handler - CommonJS format
let app;
let connectDatabase;
let logger;
let isConnected = false;

const loadModules = async () => {
  if (!app) {
    const appModule = await import('../src/app.js');
    const dbModule = await import('../src/config/database.js');
    const loggerModule = await import('../src/utils/logger.js');

    app = appModule.default;
    connectDatabase = dbModule.default;
    logger = loggerModule.logger;
  }
};

const connectToDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    await connectDatabase();
    isConnected = true;
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = async function handler(req, res) {
  try {
    await loadModules();
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

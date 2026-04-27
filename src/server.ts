import 'dotenv/config';
import http from 'http';
import app from './app';
import { connectDB, disconnectDB } from './config/database';
import { logger } from './utils/logger';




const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
/**
 * Bootstrap the application
 */
const bootstrap = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDB();
        // Start HTTP server
        server.listen(PORT, () => {
            logger.info(`
╔════════════════════════════════════════════════╗
║        Authentication Application              ║
╠════════════════════════════════════════════════╣
║  Status     : Running                          ║
║  Port       : ${String(PORT).padEnd(33)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║  API Base   : http://localhost:${String(PORT).padEnd(8)}/api    ║
║  Health     : http://localhost:${String(PORT).padEnd(8)}/health ║
╚════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {

        console.log('===================================='); (`Failed to start server: ${error}`);
        process.exit(1);
    }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal: string): Promise<void> => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        logger.info('Database connection closed. Goodbye!');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    shutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.error(error.stack || '');
    process.exit(1);
});

bootstrap();

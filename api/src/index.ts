import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { urlController } from './controller/url.controller';
import { rateLimiter } from './lib/rateLimiter';
import { initKafkaProducer, disconnectKafkaProducer } from './lib/kafka';
import { metricsMiddleware, register } from './lib/metrics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const redirectUrlLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: process.env.RATE_LIMIT_REDIRECT_MAX ? parseInt(process.env.RATE_LIMIT_REDIRECT_MAX, 10) : 1000000,
  keyPrefix: "redirect-url",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(metricsMiddleware);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to LinkForge API',
    version: '1.0.0',
    docs: '/health'
  });
});

// 1. All management APIs under /api
app.use('/api', apiRouter);

// 2. Fast public redirect for short links (GET /:shortCode -> 302 Redirect)
app.get('/:shortCode', redirectUrlLimiter, (req: Request, res: Response) => {
  urlController.redirect(req, res);
});

// 404 Handler (for unmatched routes)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});


const startServer = async () => {
  try {

    await initKafkaProducer();

    const server = app.listen(PORT, () => {
      console.log(`🚀 LinkForge API is running at http://localhost:${PORT}`);
      console.log(`🩺 Health check available at http://localhost:${PORT}/health`);
    });

    const handleShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      await disconnectKafkaProducer();
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Fatal error during server startup:", error);
    process.exit(1);
  }
};

startServer();

export default app;

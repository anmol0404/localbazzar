import { PrismaClient } from '@prisma/client';
import { config } from './env.config';

const prisma = new PrismaClient({
  datasourceUrl: config.database.url,
  log: config.nodeEnv === 'development' 
    ? ['warn', 'error'] // Only show warnings and errors, suppress info logs
    : ['error'], // Production: only errors
  errorFormat: 'minimal',
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

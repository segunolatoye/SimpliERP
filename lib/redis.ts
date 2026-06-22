import { createClient } from 'redis';

const globalForRedis = global as unknown as { redisClient?: ReturnType<typeof createClient> };

export const redisClient =
  globalForRedis.redisClient ||
  createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redisClient = redisClient;

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Only connect if not already connected
if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error);
}

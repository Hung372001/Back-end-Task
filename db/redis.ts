import { Redis } from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // pour production (Redis Cloud, Upstash, etc.)
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

export default redis;
import Redis from 'ioredis';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});


redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('disconnect', () => {
  console.log('❌ Redis disconnected');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});


const setCacheRecord = async (key: string, value: object): Promise<void> => {
  try {
    const json = JSON.stringify(value);

    if ('expiresAt' in value && value.expiresAt) {
      const ttlMs = new Date(value.expiresAt as string | Date).getTime() - Date.now();
      if (ttlMs > 0) {
        await redis.set(key, json, 'PX', ttlMs);
      }
      return;
    }

    await redis.set(key, json, 'EX', DEFAULT_TTL_SECONDS);
  } catch (error) {
    // Redis unavailable
    console.log("🚀 ~ setCacheRecord ~ error:", error)
  }
};

const deleteCacheRecord = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    // Redis unavailable
    console.log("🚀 ~ deleteCacheRecord ~ error:", error)
  }
};

const getCacheRecord = async (key: string): Promise<string | null> => {
  try {
    return await redis.get(key);
  } catch (error) {
    // Redis unavailable
    console.log("🚀 ~ getCacheRecord ~ error:", error)
    return null;
  }
};

export { setCacheRecord, deleteCacheRecord, getCacheRecord };
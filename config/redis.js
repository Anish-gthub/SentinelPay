const redis = require('redis');

// Explicitly pull the local Redis URL from your .env file
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));

(async () => {
    await redisClient.connect();
    console.log('✅ Connected to Local Redis Instance');
})();

module.exports = redisClient;
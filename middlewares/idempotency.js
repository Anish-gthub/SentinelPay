const redisClient = require('../config/redis');

const idempotencyMiddleware = async (req, res, next) => {
    if (req.path === '/api/v1/payments' && req.method === 'POST') {
        const idempotencyKey = req.headers['x-idempotency-key'];

        if (!idempotencyKey) {
            return res.status(400).json({
                success: false,
                error: 'Missing required X-Idempotency-Key header.'
            });
        }

        const redisKey = `payment_key:${idempotencyKey}`;

        try {
            // ATOMIC LOCK: Try to set the state to STARTED ONLY if the key does not exist yet.
            // NX: true makes this unbreakable. It returns 'OK' if successful, or null if key exists.
            const lockAcquired = await redisClient.set(redisKey, JSON.stringify({ status: 'STARTED' }), {
                EX: 120,
                NX: true 
            });

            // If we did NOT acquire the lock, another request beat us to it.
            if (!lockAcquired) {
                // Now it is safe to read the state
                const cachedValue = await redisClient.get(redisKey);
                
                if (cachedValue) {
                    const transaction = JSON.parse(cachedValue);

                    if (transaction.status === 'STARTED') {
                        return res.status(409).json({
                            success: false,
                            error: 'Transaction processing is already underway. Please wait.'
                        });
                    }

                    if (transaction.status === 'SUCCESS') {
                        console.log('⚡ Redis Cache Hit! Serving idempotent response.');
                        return res.status(200).json(transaction.responseBody);
                    }
                }
            }

            // We successfully claimed the atomic lock. Attach key to request and proceed.
            req.redisKey = redisKey;
            
        } catch (error) {
            console.error('Redis Middleware Error:', error);
        }
    }
    
    next();
};

module.exports = idempotencyMiddleware;
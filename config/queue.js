const { Queue } = require('bullmq');

// Initializing the queue using your local Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const paymentQueue = new Queue('post-payment-tasks', {
    connection: {
        url: redisUrl
    }
});

module.exports = paymentQueue;
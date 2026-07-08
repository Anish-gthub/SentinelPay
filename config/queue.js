const { Queue } = require('bullmq');

// Initialize the queue using your local Redis connection
const paymentQueue = new Queue('post-payment-tasks', {
    connection: {
        host: '127.0.0.1',
        port: 6379
    }
});

module.exports = paymentQueue;
const { Worker } = require('bullmq');

console.log('👷 Background Worker started. Listening for jobs...');

const { Worker } = require('bullmq');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const worker = new Worker('post-payment-tasks', async (job) => {
    // Your transaction processing code lives here...
    console.log(`Processing payment task for job: ${job.id}`);
    // console.log(`✅ Job [${job.id}] completed! Email receipt sent for Txn: ${job.data.transaction_id}`);
}, {
    connection: {
        url: redisUrl
    }
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed with error ${err.message}`);
});
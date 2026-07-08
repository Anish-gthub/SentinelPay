const { Worker } = require('bullmq');

console.log('👷 Background Worker started. Listening for jobs...');

const worker = new Worker('post-payment-tasks', async job => {
    console.log(`\n⚙️ Processing Job [${job.id}]: '${job.name}'`);
    console.log(`Payload:`, job.data);
    
    // Simulate a slow task (like sending an email or hitting a 3rd party API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Job [${job.id}] completed! Email receipt sent for Txn: ${job.data.transaction_id}`);
}, {
    connection: {
        host: '127.0.0.1',
        port: 6379
    }
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed with error ${err.message}`);
});
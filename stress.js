require('dotenv').config();
const SENDER_ID =process.env.TEST_SENDER_WALLET_ID;
const RECEIVER_ID =process.env.TEST_RECEIVER_WALLET_ID;
const AMOUNT = 10.00;

async function sendRequest(idempotencyKey) {
    try {
        const response = await fetch('https://sentinel-pay-api.onrender.com/api/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey,
                'Authorization': `Bearer ${process.env.API_SECRET_KEY}` 
            },
            body: JSON.stringify({
                sender_id: SENDER_ID,
                receiver_id: RECEIVER_ID,
                amount: AMOUNT
            })
        });
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { status: 500, error: error.message };
    }
}

async function runRedisTest() {
    console.log('\n🛡️ --- TEST 1: REDIS IDEMPOTENCY (The "Double Click") ---');
    console.log('Firing 10 concurrent requests with the EXACT SAME Idempotency Key...');
    
    const sameKey = 'identical-key-999';
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
        requests.push(sendRequest(sameKey));
    }

    // Promise.all fires them all at the exact same millisecond
    const results = await Promise.all(requests);
    
    results.forEach((res, index) => {
        const msg = res.data ? (res.data.error || res.data.message) : 'No response body';
        console.log(`Request ${index + 1}: HTTP ${res.status} ->`, msg);
    });
}

async function runPostgresTest() {
    console.log('\n🔒 --- TEST 2: POSTGRES ROW-LEVEL LOCK (The "Race Condition") ---');
    console.log('Firing 15 concurrent requests with DIFFERENT keys to the same wallet...');
    
    const requests = [];
    
    for (let i = 0; i < 15; i++) {
        // Generated a random key for each request so Redis lets them all pass to Postgres
        const randomKey = `unique-key-${Math.random()}`;
        requests.push(sendRequest(randomKey));
    }

    const results = await Promise.all(requests);
    
    results.forEach((res, index) => {
        const msg = res.data ? (res.data.error || res.data.message) : 'No response body';
        console.log(`Request ${index + 1}: HTTP ${res.status} ->`, msg);
    });
}

// Execute the tests sequentially
async function executeTests() {
    await runRedisTest();
    
    // Wait 3 seconds before starting the second test
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await runPostgresTest();
}

executeTests();
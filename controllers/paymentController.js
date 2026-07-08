const pool = require('../config/db');
const redisClient = require('../config/redis');
const paymentQueue = require('../config/queue');

const processPayment = async (req, res) => {
    const { sender_id, receiver_id, amount } = req.body;

    if (!sender_id || !receiver_id || !amount || amount <= 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request parameters. Amount must be greater than zero.' 
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Row lock configuration
        const senderQuery = 'SELECT balance FROM wallets WHERE id = $1 FOR UPDATE';
        const senderResult = await client.query(senderQuery, [sender_id]);

        if (senderResult.rows.length === 0) {
            throw new Error('Sender wallet not found.');
        }

        const senderBalance = parseFloat(senderResult.rows[0].balance);

        if (senderBalance < amount) {
            throw new Error('Insufficient funds for this transaction.');
        }

        const receiverCheck = await client.query('SELECT id FROM wallets WHERE id = $1', [receiver_id]);
        if (receiverCheck.rows.length === 0) {
            throw new Error('Receiver wallet not found.');
        }

        // Mutation blocks
        const deductQuery = 'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2';
        await client.query(deductQuery, [amount, sender_id]);

        const creditQuery = 'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2';
        await client.query(creditQuery, [amount, receiver_id]);

        // Audit Trail Entry
        const ledgerQuery = `
            INSERT INTO ledger_entries (source_wallet_id, destination_wallet_id, amount, status) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id
        `;
        const ledgerResult = await client.query(ledgerQuery, [sender_id, receiver_id, amount, 'SUCCESS']);

        await client.query('COMMIT');

        const finalResponseBody = {
            success: true,
            message: 'Transaction completed successfully.',
            transaction_id: ledgerResult.rows[0].id
        };

        if (req.redisKey) {
            const successPayload = JSON.stringify({
                status: 'SUCCESS',
                responseBody: finalResponseBody
            });
            await redisClient.set(req.redisKey, successPayload, { EX: 120 });
        }
        
        // Drop a job into the queue to run asynchronously
        await paymentQueue.add('send-receipt', {
            transaction_id: ledgerResult.rows[0].id,
            sender_id: sender_id,
            amount: amount
        });
        console.log('📦 Job added to message queue for background processing.');
        // --------------------------------------

        // Immediately respond to the user. No waiting!
        return res.status(200).json(finalResponseBody);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction failed & rolled back:', error.message);

        if (req.redisKey) {
            await redisClient.del(req.redisKey);
        }
        
        return res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    } finally {
        client.release();
    }
};

module.exports = {
    processPayment
};
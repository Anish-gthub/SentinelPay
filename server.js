require('dotenv').config();
const express = require('express');
const authenticateKey = require('./middlewares/auth');
const idempotencyMiddleware = require('./middlewares/idempotency');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simple Core Health Validation Target (Leave Unprotected)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'SentinelPay Core Gateway is active.' });
});

//Authenticate all traffic heading to /api/v1
app.use('/api/v1', authenticateKey); 

//Enforce Idempotency on transactions
app.use(idempotencyMiddleware);

// Mount Modular Endpoint Groupings
app.use('/api/v1', paymentRoutes);

app.listen(PORT, () => {
    console.log(`🚀 SentinelPay Enterprise Server running on port ${PORT}`);
});
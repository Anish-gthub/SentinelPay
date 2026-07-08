const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Map endpoints directly to execution controllers
router.post('/payments', paymentController.processPayment);

module.exports = router;
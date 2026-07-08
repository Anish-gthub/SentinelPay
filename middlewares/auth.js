// middlewares/auth.js
const authenticateKey = (req, res, next) => {
    // 1. Extract the Authorization header
    const authHeader = req.headers['authorization'];

    // 2. Fast-fail if the header is missing or doesn't use the Bearer scheme
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized: Missing or invalid Bearer token.' 
        });
    }

    // 3. Extract just the token string (removing the "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // 4. Validate against our environment secret
    if (token !== process.env.API_SECRET_KEY) {
        return res.status(403).json({ 
            success: false, 
            error: 'Forbidden: Invalid API Key.' 
        });
    }

    // 5. Token is valid, allow the request to proceed to the next middleware (Idempotency)
    next();
};

module.exports = authenticateKey;
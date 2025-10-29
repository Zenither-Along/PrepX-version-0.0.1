const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Check if the server is configured with a secret
        if (!process.env.JWT_SECRET) {
            console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
            return res.status(500).json({ msg: 'Server configuration error: JWT secret not set.' });
        }

        // Check for 'Bearer ' prefix and extract token
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
             return res.status(401).json({ msg: 'Token format is "Bearer <token>"' });
        }
        const token = tokenParts[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Robust check for the decoded payload structure
        if (!decoded || !decoded.user || !decoded.user.id) {
            return res.status(401).json({ msg: 'Token is invalid or malformed' });
        }
        
        // Attach user from payload to request object
        req.user = decoded.user;
        next();
    } catch (err) {
        // Log the error for easier debugging on the server
        console.error('Auth middleware error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (!req.user || !req.user.role || req.user.role.toLowerCase() !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Requires Admin role.' });
        }
        next();
    });
};

module.exports = { authMiddleware, adminMiddleware };

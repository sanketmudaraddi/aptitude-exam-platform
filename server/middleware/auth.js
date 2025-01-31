const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Regular authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Please authenticate' 
        });
    }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Admin authentication required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Admin access required' 
            });
        }

        if (!user.is_verified) {
            return res.status(401).json({
                success: false,
                message: 'Account not verified'
            });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Please authenticate as admin' 
        });
    }
};

const studentAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Student authentication required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user || user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Student access required' 
            });
        }

        if (!user.is_verified) {
            return res.status(401).json({
                success: false,
                message: 'Account not verified'
            });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Please authenticate as student' 
        });
    }
};

module.exports = {
    auth,
    adminAuth,
    studentAuth
}; 
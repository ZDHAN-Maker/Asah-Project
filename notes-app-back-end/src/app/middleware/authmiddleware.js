const jwt = require('jsonwebtoken');
require('dotenv').config();
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Gantilah dengan secret key Anda
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  }
};

module.exports = authMiddleware;

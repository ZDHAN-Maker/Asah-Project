const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, '57f762d16849f94597fe59538c8c8dd8301198ce32163d9cd3ed9037381c330b1738ee0638a6a7979ee3573e3501d6e46ea916e6c8b14a2c2155c3257d475e82');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  }
};

module.exports = authMiddleware;

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const raw = req.header('Authorization');
  const token = raw?.startsWith('Bearer ') ? raw.slice(7) : null;

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Missing authentication' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    req.auth = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  }
};

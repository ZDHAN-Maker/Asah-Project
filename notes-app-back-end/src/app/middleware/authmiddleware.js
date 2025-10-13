const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const raw = req.header('Authorization');
  const token = raw?.startsWith('Bearer ') ? raw.slice(7) : null;

  if (!token) return res.status(401).json({ status: 'fail', message: 'Missing authentication' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: decoded.userId, username: decoded.username };
    return next();
  } catch {
    return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  }
};

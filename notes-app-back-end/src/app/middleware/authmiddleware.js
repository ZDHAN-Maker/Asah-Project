const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const raw = req.header('Authorization');
  const token = raw?.startsWith('Bearer ') ? raw.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Missing authentication',
    });
  }

  try {
    // Verifikasi token JWT
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);

    // Simpan payload ke req.auth agar bisa diakses handler
    req.auth = {
      userId: decoded.id || decoded.userId, // jaga-jaga field token berbeda
      username: decoded.username,
    };

    // Lanjut ke middleware berikutnya
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token',
    });
  }
};

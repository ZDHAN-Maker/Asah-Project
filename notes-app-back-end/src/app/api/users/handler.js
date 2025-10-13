const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsersService = require('../../services/UsersService');
const { validateCreateUser } = require('./validator');
const ClientError = require('../../utils/error/ClientError');

const refreshStore = new Set();

class UsersHandler {
  // POST /users
  async postUserHandler(req, res) {
    try {
      validateCreateUser(req.body);
      const { username, password, fullname } = req.body;

      await UsersService.verifyNewUsername(username);
      const hashed = await bcrypt.hash(password, 10);
      const userId = await UsersService.addUser({ username, password: hashed, fullname });

      return res.status(201).json({ status: 'success', data: { userId } });
    } catch (e) {
      if (e instanceof ClientError) {
        return res.status(e.statusCode).json({ status: 'fail', message: e.message });
      }
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // POST /authentications
  async loginHandler(req, res) {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      const user = await UsersService.getUserByUsername(username);
      if (!user) return res.status(401).json({ status: 'fail', message: 'Kredensial tidak valid' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ status: 'fail', message: 'Kredensial tidak valid' });

      const accessToken = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const refreshToken = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      refreshStore.add(refreshToken);

      return res.status(201).json({ status: 'success', data: { accessToken, refreshToken } });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // PUT /authentications
  async refreshHandler(req, res) {
    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken) return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      if (!refreshStore.has(refreshToken)) {
        return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const accessToken = jwt.sign(
        { userId: decoded.userId, username: decoded.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.status(200).json({ status: 'success', data: { accessToken } });
    } catch {
      return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
    }
  }

  // DELETE /authentications
  async logoutHandler(req, res) {
    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken) return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      if (!refreshStore.has(refreshToken)) {
        return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
      }
      refreshStore.delete(refreshToken);
      return res.status(200).json({ status: 'success', message: 'Authentication deleted' });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }
}

module.exports = new UsersHandler();

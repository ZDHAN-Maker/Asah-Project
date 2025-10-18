const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsersService = require('../../services/UsersService');
const { validateCreateUser } = require('./validator');
const ClientError = require('../../utils/error/ClientError');

const refreshStore = new Set();

class UsersHandler {
  // REGISTER
  async postUserHandler(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      validateCreateUser(req.body);
      const { username, password, fullname } = req.body;

      await UsersService.verifyNewUsername(username);

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await UsersService.addUser({
        username,
        password: hashedPassword,
        fullname,
      });

      return res.status(201).json({
        status: 'success',
        data: { userId },
      });
    } catch (e) {
      console.error('Register error:', e);

      if (e instanceof ClientError) {
        return res.status(e.statusCode || 400).json({ status: 'fail', message: e.message });
      }

      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // LOGIN
  async loginHandler(req, res) {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      const { username, password } = req.body;

      if (typeof username !== 'string' || typeof password !== 'string') {
        return res
          .status(400)
          .json({ status: 'fail', message: 'Username dan password harus berupa string' });
      }

      const user = await UsersService.getUserByUsername(username);

      if (!user || typeof user.password !== 'string') {
        return res.status(401).json({ status: 'fail', message: 'Kredensial tidak valid' });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ status: 'fail', message: 'Kredensial tidak valid' });
      }

      if (!process.env.ACCESS_TOKEN_KEY || !process.env.REFRESH_TOKEN_KEY) {
        console.error('JWT secret key belum diatur di .env');
        return res
          .status(500)
          .json({ status: 'error', message: 'Konfigurasi server tidak lengkap' });
      }

      const payload = { userId: user.id, username: user.username };

      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: '1h',
      });

      const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, {
        expiresIn: '7d',
      });

      refreshStore.add(refreshToken);

      return res.status(201).json({
        status: 'success',
        data: { accessToken, refreshToken },
      });
    } catch (e) {
      console.error('Unexpected login error:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }

  // REFRESH TOKEN
  async refreshHandler(req, res) {
    try {
      const { refreshToken } = req.body || {};

      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      if (!refreshStore.has(refreshToken)) {
        return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
      } catch {
        return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
      }

      const newAccessToken = jwt.sign(
        { userId: decoded.userId, username: decoded.username },
        process.env.ACCESS_TOKEN_KEY,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        status: 'success',
        data: { accessToken: newAccessToken },
      });
    } catch (e) {
      console.error('Refresh error:', e.message);
      return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
    }
  }

  // LOGOUT
  async logoutHandler(req, res) {
    try {
      const { refreshToken } = req.body || {};

      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({ status: 'fail', message: 'Invalid payload' });
      }

      if (!refreshStore.has(refreshToken)) {
        return res.status(400).json({ status: 'fail', message: 'Refresh token tidak valid' });
      }

      refreshStore.delete(refreshToken);

      return res.status(200).json({
        status: 'success',
        message: 'Authentication deleted',
      });
    } catch (e) {
      console.error('Logout error:', e);
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
  }
}

module.exports = UsersHandler;

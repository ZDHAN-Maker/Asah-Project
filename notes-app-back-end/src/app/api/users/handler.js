const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserService = require('./service');
const ClientError = require('../../utils/error/ClientError');
const { JWT_SECRET } = process.env; // Pastikan JWT_SECRET ada di .env

class UsersHandler {
  // Registrasi pengguna
  async postUserHandler(req, res) {
    try {
      const { username, password, fullname } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await UserService.createUser({ username, password: hashedPassword, fullname });

      return res.status(201).json({
        status: 'success',
        data: { userId: user.id }
      });
    } catch (error) {
      console.error('User Registration Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to register user'
      });
    }
  }

  // Login pengguna (untuk mendapatkan accessToken dan refreshToken)
  async postAuthenticationHandler(req, res) {
    try {
      const { username, password } = req.body;

      const user = await UserService.findUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ClientError('Invalid credentials');
      }

      // Membuat JWT token dan refresh token
      const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        status: 'success',
        data: { accessToken, refreshToken }
      });
    } catch (error) {
      if (error instanceof ClientError) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message
        });
      }
      console.error('Authentication Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate user'
      });
    }
  }

  // Update access token menggunakan refresh token
  async putAuthenticationHandler(req, res) {
    try {
      const { refreshToken } = req.body;

      // Verifikasi refresh token dan buat access token baru
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });

      return res.status(200).json({
        status: 'success',
        data: { accessToken }
      });
    } catch (error) {
      console.error('Refresh Token Error:', error);
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid refresh token'
      });
    }
  }

  // Menghapus autentikasi (logout)
  async deleteAuthenticationHandler(req, res) {
    try {
      const { refreshToken } = req.body;

      // Hapus refresh token dari klien
      return res.status(200).json({
        status: 'success',
        message: 'Authentication deleted successfully'
      });
    } catch (error) {
      console.error('Logout Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete authentication'
      });
    }
  }
}

module.exports = new UsersHandler();

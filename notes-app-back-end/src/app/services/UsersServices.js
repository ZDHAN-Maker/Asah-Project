const { nanoid } = require('nanoid');
const pool = require('../../db');
const InvariantError = require('../../utils/error/InvariantError');

class UsersService {
  async verifyNewUsername(username) {
    const { rowCount } = await pool.query('SELECT 1 FROM users WHERE username=$1', [username]);
    if (rowCount) throw new InvariantError('Username already taken');
  }

  async addUser({ username, password, fullname }) {
    const id = `user-${nanoid(16)}`;
    const q = 'NSERT INTO users (id, username, password, fullname) VALUES ($1,$2,$3,$4) RETURNING id';
    const { rows } = await pool.query(q, [id, username, password, fullname]);
    return rows[0].id;
  }

  async getUserByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    return rows[0] || null;
  }
}
module.exports = new UsersService();

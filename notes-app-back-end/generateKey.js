const crypto = require('crypto');

const key = crypto.randomBytes(64).toString('hex');
console.log(key);
// Simpan key ini di file .env sebagai JWT_SECRET
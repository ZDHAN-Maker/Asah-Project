const crypto = require('crypto');

function generateKey(label) {
  const key = crypto.randomBytes(64).toString('hex');
  console.log(`${label}=${key}`);
}

generateKey('ACCESS_TOKEN_KEY');
generateKey('REFRESH_TOKEN_KEY');

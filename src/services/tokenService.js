const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'default_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

function generarToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generarToken, verificarToken };

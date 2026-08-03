const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generarToken } = require('../services/tokenService');

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol };
    const token = generarToken(payload);

    // Guardar en cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    return res.json({ ok: true, token, user: payload });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('token');
  return res.json({ ok: true, message: 'Sesión cerrada' });
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, nombre, rol FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error('Error en me:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { login, logout, me };

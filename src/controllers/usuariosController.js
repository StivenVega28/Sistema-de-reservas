const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/usuarios
async function listar(req, res) {
  try {
    const [rows] = await pool.execute('SELECT id, username, nombre, rol, activo, created_at FROM usuarios ORDER BY id');
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar usuarios:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/usuarios/meseros
async function listarMeseros(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, nombre FROM usuarios WHERE rol = "mesero" AND activo = 1 ORDER BY nombre'
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar meseros:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/usuarios/reset-demo
async function resetDemo(req, res) {
  try {
    // Limpiar datos transaccionales
    await pool.execute('DELETE FROM detalle_modificadores');
    await pool.execute('DELETE FROM pedido_detalle');
    await pool.execute('DELETE FROM despachos');
    await pool.execute('DELETE FROM facturas');
    await pool.execute('DELETE FROM cierres_caja');
    await pool.execute('DELETE FROM pedidos');
    await pool.execute('DELETE FROM reservas');
    await pool.execute('DELETE FROM auditoria');
    
    // Resetear estados de mesas
    await pool.execute('UPDATE mesas SET estado = "disponible", mesero_id = NULL');

    // Resetear stock de insumos
    await pool.execute('UPDATE insumos SET stock_actual = 100');

    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id) VALUES (?,?,?,?)',
      [req.user.id, 'reset_demo', 'sistema', 0]
    );

    return res.json({ ok: true, message: 'Datos demo reseteados exitosamente' });
  } catch (err) {
    console.error('Error reset demo:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, listarMeseros, resetDemo };

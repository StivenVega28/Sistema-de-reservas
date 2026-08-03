const pool = require('../config/db');

// GET /api/mesas
async function listar(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT m.*, u.nombre AS mesero_nombre 
      FROM mesas m 
      LEFT JOIN usuarios u ON m.mesero_id = u.id 
      ORDER BY m.numero
    `);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar mesas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/mesas/:id
async function obtener(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT m.*, u.nombre AS mesero_nombre 
      FROM mesas m 
      LEFT JOIN usuarios u ON m.mesero_id = u.id 
      WHERE m.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Mesa no encontrada' });
    return res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error('Error obtener mesa:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/mesas/:id
async function actualizar(req, res) {
  try {
    const { capacidad, estado, pos_x, pos_y, mesero_id } = req.body;
    const [old] = await pool.execute('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Mesa no encontrada' });

    await pool.execute(
      `UPDATE mesas SET capacidad = COALESCE(?, capacidad), estado = COALESCE(?, estado), 
       pos_x = COALESCE(?, pos_x), pos_y = COALESCE(?, pos_y), mesero_id = ? WHERE id = ?`,
      [capacidad, estado, pos_x, pos_y, mesero_id !== undefined ? mesero_id : old[0].mesero_id, req.params.id]
    );

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'actualizar', 'mesas', req.params.id, JSON.stringify(old[0]), JSON.stringify(req.body)]
    );

    const [updated] = await pool.execute('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    return res.json({ ok: true, data: updated[0] });
  } catch (err) {
    console.error('Error actualizar mesa:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/mesas/:id/asignar-mesero
async function asignarMesero(req, res) {
  try {
    const { mesero_id } = req.body;
    await pool.execute('UPDATE mesas SET mesero_id = ? WHERE id = ?', [mesero_id, req.params.id]);
    return res.json({ ok: true, message: 'Mesero asignado' });
  } catch (err) {
    console.error('Error asignar mesero:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/mesas/trasladar
async function trasladar(req, res) {
  try {
    const { pedido_id, mesa_origen_id, mesa_destino_id } = req.body;

    // Verificar mesa destino disponible
    const [destino] = await pool.execute('SELECT * FROM mesas WHERE id = ? AND estado = "disponible"', [mesa_destino_id]);
    if (destino.length === 0) {
      return res.status(400).json({ error: 'La mesa destino no está disponible' });
    }

    // Mover pedido
    await pool.execute('UPDATE pedidos SET mesa_id = ? WHERE id = ?', [mesa_destino_id, pedido_id]);
    // Actualizar estados de mesas
    await pool.execute('UPDATE mesas SET estado = "disponible", mesero_id = NULL WHERE id = ?', [mesa_origen_id]);
    await pool.execute('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [mesa_destino_id]);

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_nuevos) VALUES (?,?,?,?,?)',
      [req.user.id, 'trasladar_mesa', 'pedidos', pedido_id, JSON.stringify({ mesa_origen_id, mesa_destino_id })]
    );

    return res.json({ ok: true, message: 'Pedido trasladado exitosamente' });
  } catch (err) {
    console.error('Error trasladar:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, obtener, actualizar, asignarMesero, trasladar };

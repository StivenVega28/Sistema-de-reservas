const pool = require('../config/db');

// GET /api/despachos
async function listar(req, res) {
  try {
    const { estado } = req.query;
    let sql = `
      SELECT d.*, m.numero AS mesa_numero, p.estado AS pedido_estado,
             u.nombre AS despachador_nombre
      FROM despachos d
      JOIN mesas m ON d.mesa_id = m.id
      JOIN pedidos p ON d.pedido_id = p.id
      LEFT JOIN usuarios u ON d.despachador_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (estado) { sql += ' AND d.estado = ?'; params.push(estado); }
    sql += ' ORDER BY d.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar despachos:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/despachos
async function crear(req, res) {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) return res.status(400).json({ error: 'pedido_id requerido' });

    const [pedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [pedido_id]);
    if (pedido.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Verificar que hay platos listos
    const [listos] = await pool.execute(
      'SELECT id FROM pedido_detalle WHERE pedido_id = ? AND estado = "listo"',
      [pedido_id]
    );
    if (listos.length === 0) {
      return res.status(400).json({ error: 'No hay platos listos para despachar' });
    }

    const [result] = await pool.execute(
      'INSERT INTO despachos (pedido_id, mesa_id, despachador_id) VALUES (?, ?, ?)',
      [pedido_id, pedido[0].mesa_id, req.user.id]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear despacho:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/despachos/:id/estado
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    if (!['en_ruta', 'entregado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado debe ser en_ruta o entregado' });
    }

    const [old] = await pool.execute('SELECT * FROM despachos WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Despacho no encontrado' });

    await pool.execute('UPDATE despachos SET estado = ? WHERE id = ?', [estado, req.params.id]);

    // Si se marca como entregado, actualizar detalle del pedido
    if (estado === 'entregado') {
      await pool.execute(
        'UPDATE pedido_detalle SET estado = "entregado" WHERE pedido_id = ? AND estado = "listo"',
        [old[0].pedido_id]
      );
      // Si todo el pedido está entregado, actualizar pedido
      const [pendientes] = await pool.execute(
        'SELECT id FROM pedido_detalle WHERE pedido_id = ? AND estado NOT IN ("entregado","cancelado")',
        [old[0].pedido_id]
      );
      if (pendientes.length === 0) {
        await pool.execute('UPDATE pedidos SET estado = "entregado" WHERE id = ?', [old[0].pedido_id]);
      }
    }

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'cambiar_estado', 'despachos', req.params.id,
       JSON.stringify({ estado: old[0].estado }), JSON.stringify({ estado })]
    );

    return res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    console.error('Error cambiar estado despacho:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, crear, cambiarEstado };

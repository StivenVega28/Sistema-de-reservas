const pool = require('../config/db');

// GET /api/cocina/cola — platos pendientes y en preparacion
async function cola(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT pd.id, pd.pedido_id, pd.plato_id, pd.cantidad, pd.notas, pd.estado, pd.created_at,
             pl.nombre AS plato_nombre, pl.imagen_url,
             m.numero AS mesa_numero, p.mesa_id
      FROM pedido_detalle pd
      JOIN platos pl ON pd.plato_id = pl.id
      JOIN pedidos p ON pd.pedido_id = p.id
      JOIN mesas m ON p.mesa_id = m.id
      WHERE pd.estado IN ('pendiente', 'en_preparacion')
      ORDER BY 
        CASE pd.estado WHEN 'pendiente' THEN 0 WHEN 'en_preparacion' THEN 1 END,
        pd.created_at ASC
    `);

    // Agregar modificadores
    for (const r of rows) {
      const [mods] = await pool.execute(`
        SELECT dm.*, mo.nombre AS modificador_nombre 
        FROM detalle_modificadores dm 
        LEFT JOIN modificadores mo ON dm.modificador_id = mo.id 
        WHERE dm.detalle_id = ?
      `, [r.id]);
      r.modificadores = mods;
    }

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error cola cocina:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/cocina/:detalleId/estado
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    if (!['en_preparacion', 'listo'].includes(estado)) {
      return res.status(400).json({ error: 'Estado debe ser en_preparacion o listo' });
    }

    const [old] = await pool.execute('SELECT * FROM pedido_detalle WHERE id = ?', [req.params.detalleId]);
    if (old.length === 0) return res.status(404).json({ error: 'Item no encontrado' });

    await pool.execute('UPDATE pedido_detalle SET estado = ? WHERE id = ?', [estado, req.params.detalleId]);

    // Si todos los items del pedido estan listos, actualizar pedido
    if (estado === 'listo') {
      const [pendientes] = await pool.execute(
        'SELECT id FROM pedido_detalle WHERE pedido_id = ? AND estado NOT IN ("listo","entregado","cancelado")',
        [old[0].pedido_id]
      );
      if (pendientes.length === 0) {
        await pool.execute('UPDATE pedidos SET estado = "listo" WHERE id = ?', [old[0].pedido_id]);
      } else {
        await pool.execute('UPDATE pedidos SET estado = "en_preparacion" WHERE id = ?', [old[0].pedido_id]);
      }
    }

    if (estado === 'en_preparacion') {
      await pool.execute(
        'UPDATE pedidos SET estado = "en_preparacion" WHERE id = ? AND estado = "abierto"',
        [old[0].pedido_id]
      );
    }

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'cambiar_estado', 'pedido_detalle', req.params.detalleId, 
       JSON.stringify({ estado: old[0].estado }), JSON.stringify({ estado })]
    );

    return res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    console.error('Error cambiar estado cocina:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { cola, cambiarEstado };

const pool = require('../config/db');

// GET /api/reservas
async function listar(req, res) {
  try {
    const { fecha, estado } = req.query;
    let sql = `
      SELECT r.*, m.numero AS mesa_numero, u.nombre AS creador_nombre 
      FROM reservas r 
      JOIN mesas m ON r.mesa_id = m.id 
      LEFT JOIN usuarios u ON r.creada_por = u.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha) { sql += ' AND r.fecha = ?'; params.push(fecha); }
    if (estado) { sql += ' AND r.estado = ?'; params.push(estado); }

    sql += ' ORDER BY r.fecha, r.hora';
    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar reservas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/reservas
async function crear(req, res) {
  try {
    const { mesa_id, cliente_nombre, cliente_telefono, personas, fecha, hora, notas } = req.body;
    if (!mesa_id || !cliente_nombre || !fecha || !hora) {
      return res.status(400).json({ error: 'Campos obligatorios: mesa_id, cliente_nombre, fecha, hora' });
    }

    // Verificar disponibilidad de mesa en fecha/hora
    const [conflictos] = await pool.execute(
      `SELECT id FROM reservas 
       WHERE mesa_id = ? AND fecha = ? AND estado IN ('pendiente','confirmada') 
       AND ABS(TIMESTAMPDIFF(MINUTE, hora, ?)) < 90`,
      [mesa_id, fecha, hora]
    );
    if (conflictos.length > 0) {
      return res.status(400).json({ error: 'La mesa ya tiene una reserva en esa franja horaria' });
    }

    const [result] = await pool.execute(
      `INSERT INTO reservas (mesa_id, cliente_nombre, cliente_telefono, personas, fecha, hora, notas, creada_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [mesa_id, cliente_nombre, cliente_telefono || null, personas || 1, fecha, hora, notas || null, req.user.id]
    );

    // Marcar mesa como reservada
    await pool.execute('UPDATE mesas SET estado = "reservada" WHERE id = ? AND estado = "disponible"', [mesa_id]);

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_nuevos) VALUES (?,?,?,?,?)',
      [req.user.id, 'crear', 'reservas', result.insertId, JSON.stringify(req.body)]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear reserva:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/reservas/:id/estado
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'confirmada', 'en_mesa', 'completada', 'cancelada', 'no_show'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const [old] = await pool.execute('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });

    await pool.execute('UPDATE reservas SET estado = ? WHERE id = ?', [estado, req.params.id]);

    // Si se cancela o no_show, liberar mesa
    if (estado === 'cancelada' || estado === 'no_show' || estado === 'completada') {
      await pool.execute(
        'UPDATE mesas SET estado = "disponible" WHERE id = ? AND estado = "reservada"',
        [old[0].mesa_id]
      );
    }

    // Si pasa a en_mesa, marcar mesa como ocupada
    if (estado === 'en_mesa') {
      await pool.execute('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [old[0].mesa_id]);
    }

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'cambiar_estado', 'reservas', req.params.id, JSON.stringify({ estado: old[0].estado }), JSON.stringify({ estado })]
    );

    return res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    console.error('Error cambiar estado reserva:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// Verificar no-shows automaticamente
async function verificarNoShows() {
  try {
    const minutos = parseInt(process.env.NOSHOW_MINUTES) || 30;
    const [reservas] = await pool.execute(
      `SELECT r.id, r.mesa_id FROM reservas r 
       WHERE r.estado IN ('pendiente', 'confirmada') 
       AND CONCAT(r.fecha, ' ', r.hora) < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [minutos]
    );

    for (const r of reservas) {
      await pool.execute('UPDATE reservas SET estado = "no_show" WHERE id = ?', [r.id]);
      await pool.execute('UPDATE mesas SET estado = "disponible" WHERE id = ? AND estado = "reservada"', [r.mesa_id]);
    }

    if (reservas.length > 0) {
      console.log(`${reservas.length} reservas marcadas como no_show`);
    }
  } catch (err) {
    console.error('Error verificar no-shows:', err);
  }
}

// GET /api/reservas/calendario
async function calendario(req, res) {
  try {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Se requieren parametros inicio y fin (YYYY-MM-DD)' });
    }
    const [rows] = await pool.execute(
      `SELECT r.*, m.numero AS mesa_numero 
       FROM reservas r 
       JOIN mesas m ON r.mesa_id = m.id 
       WHERE r.fecha BETWEEN ? AND ? 
       AND r.estado NOT IN ('cancelada') 
       ORDER BY r.fecha, r.hora`,
      [inicio, fin]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error calendario:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, crear, cambiarEstado, verificarNoShows, calendario };

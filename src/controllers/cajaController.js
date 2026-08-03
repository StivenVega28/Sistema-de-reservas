const pool = require('../config/db');

// POST /api/caja/cierre
async function cierreCaja(req, res) {
  try {
    const { fecha, turno, notas } = req.body;
    const fechaCierre = fecha || new Date().toISOString().split('T')[0];

    // Calcular totales del dia
    const [totales] = await pool.execute(`
      SELECT 
        COUNT(*) AS num_facturas,
        COALESCE(SUM(total), 0) AS total_ventas,
        COALESCE(SUM(monto_efectivo), 0) AS total_efectivo,
        COALESCE(SUM(monto_tarjeta), 0) AS total_tarjeta,
        COALESCE(SUM(propina), 0) AS total_propinas
      FROM facturas 
      WHERE DATE(created_at) = ? AND estado = 'pagada'
    `, [fechaCierre]);

    const data = totales[0];

    const [result] = await pool.execute(
      `INSERT INTO cierres_caja (usuario_id, fecha, turno, total_efectivo, total_tarjeta, total_propinas, total_ventas, num_facturas, notas)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user.id, fechaCierre, turno || 'completo', data.total_efectivo, data.total_tarjeta, data.total_propinas, data.total_ventas, data.num_facturas, notas || null]
    );

    return res.status(201).json({ ok: true, id: result.insertId, data: { ...data, fecha: fechaCierre, turno } });
  } catch (err) {
    console.error('Error cierre caja:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/caja/cierres
async function listarCierres(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, u.nombre AS usuario_nombre 
      FROM cierres_caja c 
      JOIN usuarios u ON c.usuario_id = u.id 
      ORDER BY c.fecha DESC, c.created_at DESC
    `);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar cierres:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/caja/resumen-dia?fecha=
async function resumenDia(req, res) {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const [totales] = await pool.execute(`
      SELECT 
        COUNT(*) AS num_facturas,
        COALESCE(SUM(total), 0) AS total_ventas,
        COALESCE(SUM(monto_efectivo), 0) AS total_efectivo,
        COALESCE(SUM(monto_tarjeta), 0) AS total_tarjeta,
        COALESCE(SUM(propina), 0) AS total_propinas
      FROM facturas 
      WHERE DATE(created_at) = ? AND estado = 'pagada'
    `, [fecha]);

    const [facturas] = await pool.execute(`
      SELECT f.*, m.numero AS mesa_numero 
      FROM facturas f 
      JOIN mesas m ON f.mesa_id = m.id 
      WHERE DATE(f.created_at) = ? AND f.estado = 'pagada'
      ORDER BY f.created_at
    `, [fecha]);

    return res.json({ ok: true, data: { fecha, ...totales[0], resumen: totales[0], facturas } });
  } catch (err) {
    console.error('Error resumen dia:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { cierreCaja, listarCierres, resumenDia };

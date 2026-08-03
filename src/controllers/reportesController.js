const pool = require('../config/db');

// GET /api/reportes/ventas?inicio=&fin=
async function ventasPorPeriodo(req, res) {
  try {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) return res.status(400).json({ error: 'Se requieren inicio y fin (YYYY-MM-DD)' });

    const [resumen] = await pool.execute(`
      SELECT 
        DATE(created_at) AS fecha,
        COUNT(*) AS num_facturas,
        SUM(subtotal) AS subtotal,
        SUM(impuesto_valor) AS impuestos,
        SUM(total) AS total,
        SUM(propina) AS propinas
      FROM facturas 
      WHERE DATE(created_at) BETWEEN ? AND ? AND estado = 'pagada'
      GROUP BY DATE(created_at)
      ORDER BY fecha
    `, [inicio, fin]);

    const [totales] = await pool.execute(`
      SELECT 
        COUNT(*) AS num_facturas,
        COALESCE(SUM(total), 0) AS total_ventas,
        COALESCE(SUM(monto_efectivo), 0) AS total_efectivo,
        COALESCE(SUM(monto_tarjeta), 0) AS total_tarjeta,
        COALESCE(SUM(propina), 0) AS total_propinas
      FROM facturas 
      WHERE DATE(created_at) BETWEEN ? AND ? AND estado = 'pagada'
    `, [inicio, fin]);

    return res.json({ ok: true, data: { resumen_diario: resumen, totales: totales[0] } });
  } catch (err) {
    console.error('Error reporte ventas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/reportes/platos-vendidos?inicio=&fin=
async function platosMasVendidos(req, res) {
  try {
    const { inicio, fin } = req.query;
    let sql = `
      SELECT pl.id, pl.nombre, pl.precio, 
             SUM(pd.cantidad) AS total_vendido,
             SUM(pd.cantidad * pd.precio_unitario) AS total_ingresos
      FROM pedido_detalle pd
      JOIN platos pl ON pd.plato_id = pl.id
      JOIN pedidos p ON pd.pedido_id = p.id
      WHERE pd.estado != 'cancelado'
    `;
    const params = [];
    if (inicio && fin) {
      sql += ' AND DATE(pd.created_at) BETWEEN ? AND ?';
      params.push(inicio, fin);
    }
    sql += ' GROUP BY pl.id, pl.nombre, pl.precio ORDER BY total_vendido DESC';

    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error reporte platos:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/reportes/mesas-rotacion?inicio=&fin=
async function mesasRotacion(req, res) {
  try {
    const { inicio, fin } = req.query;
    let sql = `
      SELECT m.id, m.numero, 
             COUNT(DISTINCT p.id) AS total_pedidos,
             COALESCE(SUM(f.total), 0) AS total_ingresos
      FROM mesas m
      LEFT JOIN pedidos p ON m.id = p.mesa_id
      LEFT JOIN facturas f ON p.id = f.pedido_id AND f.estado = 'pagada'
      WHERE 1=1
    `;
    const params = [];
    if (inicio && fin) {
      sql += ' AND DATE(p.created_at) BETWEEN ? AND ?';
      params.push(inicio, fin);
    }
    sql += ' GROUP BY m.id, m.numero ORDER BY total_pedidos DESC';

    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error reporte mesas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/reportes/auditoria?entidad=&fecha=
async function auditoria(req, res) {
  try {
    const { entidad, fecha, limit: lim } = req.query;
    let sql = `
      SELECT a.*, u.nombre AS usuario_nombre 
      FROM auditoria a 
      LEFT JOIN usuarios u ON a.usuario_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    if (entidad) { sql += ' AND a.entidad = ?'; params.push(entidad); }
    if (fecha) { sql += ' AND DATE(a.created_at) = ?'; params.push(fecha); }
    const limit = Math.min(Math.max(parseInt(lim) || 100, 1), 500);
    sql += ` ORDER BY a.created_at DESC LIMIT ${limit}`;

    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error auditoria:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/reportes/estadisticas — dashboard stats
async function estadisticas(req, res) {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const [reservasHoy] = await pool.execute(
      'SELECT COUNT(*) AS total FROM reservas WHERE fecha = ? AND estado NOT IN ("cancelada")',
      [hoy]
    );
    const [platosPendientes] = await pool.execute(
      'SELECT COUNT(*) AS total FROM pedido_detalle WHERE estado IN ("pendiente","en_preparacion")'
    );
    const [despachosActivos] = await pool.execute(
      'SELECT COUNT(*) AS total FROM despachos WHERE estado IN ("pendiente","en_ruta")'
    );
    const [mesasOcupadas] = await pool.execute(
      'SELECT COUNT(*) AS total FROM mesas WHERE estado = "ocupada"'
    );
    const [mesasReservadas] = await pool.execute(
      'SELECT COUNT(*) AS total FROM mesas WHERE estado = "reservada"'
    );
    const [mesasDisponibles] = await pool.execute(
      'SELECT COUNT(*) AS total FROM mesas WHERE estado = "disponible"'
    );
    const [ventasHoy] = await pool.execute(
      'SELECT COALESCE(SUM(total), 0) AS total FROM facturas WHERE DATE(created_at) = ? AND estado = "pagada"',
      [hoy]
    );
    const [pedidosAbiertos] = await pool.execute(
      'SELECT COUNT(*) AS total FROM pedidos WHERE estado IN ("abierto","en_preparacion","listo")'
    );

    return res.json({
      ok: true,
      data: {
        reservas_hoy: reservasHoy[0].total,
        platos_pendientes: platosPendientes[0].total,
        despachos_activos: despachosActivos[0].total,
        mesas_ocupadas: mesasOcupadas[0].total,
        mesas_reservadas: mesasReservadas[0].total,
        mesas_disponibles: mesasDisponibles[0].total,
        ventas_hoy: ventasHoy[0].total,
        pedidos_abiertos: pedidosAbiertos[0].total
      }
    });
  } catch (err) {
    console.error('Error estadisticas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { ventasPorPeriodo, platosMasVendidos, mesasRotacion, auditoria, estadisticas };

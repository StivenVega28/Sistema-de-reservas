const pool = require('../config/db');

// GET /api/facturacion
async function listar(req, res) {
  try {
    const { estado, fecha } = req.query;
    let sql = `
      SELECT f.*, m.numero AS mesa_numero, u.nombre AS mesero_nombre
      FROM facturas f
      JOIN mesas m ON f.mesa_id = m.id
      LEFT JOIN usuarios u ON f.mesero_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (estado) { sql += ' AND f.estado = ?'; params.push(estado); }
    if (fecha) { sql += ' AND DATE(f.created_at) = ?'; params.push(fecha); }
    sql += ' ORDER BY f.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar facturas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/facturacion/generar
async function generar(req, res) {
  try {
    const { pedido_id, metodo_pago, monto_efectivo, monto_tarjeta, propina, num_comensales_division, cliente_nit, cliente_razon_social } = req.body;

    if (!pedido_id) return res.status(400).json({ error: 'pedido_id requerido' });

    const [pedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [pedido_id]);
    if (pedido.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido[0].estado === 'cancelado') {
      return res.status(400).json({ error: 'No se puede facturar un pedido cancelado' });
    }

    const [facturaExistente] = await pool.execute(
      'SELECT id FROM facturas WHERE pedido_id = ? AND estado != "anulada" LIMIT 1',
      [pedido_id]
    );
    if (facturaExistente.length > 0) {
      return res.status(400).json({ error: 'Este pedido ya tiene una factura generada' });
    }

    // Calcular subtotal
    const [detalles] = await pool.execute(
      'SELECT SUM(cantidad * precio_unitario) AS subtotal FROM pedido_detalle WHERE pedido_id = ? AND estado != "cancelado"',
      [pedido_id]
    );
    const subtotal = parseFloat(detalles[0].subtotal || 0);
    if (subtotal <= 0) return res.status(400).json({ error: 'El pedido no tiene items facturables' });
    const impuesto_porcentaje = 8.00;
    const propinaValor = parseFloat(propina || 0);
    const impuesto_valor = parseFloat((subtotal * impuesto_porcentaje / 100).toFixed(2));
    const total = parseFloat((subtotal + impuesto_valor + propinaValor).toFixed(2));

    // Calcular cambio si paga en efectivo
    let cambio = 0;
    if (metodo_pago === 'efectivo' && monto_efectivo) {
      cambio = parseFloat((monto_efectivo - total).toFixed(2));
    }

    // Generar consecutivo
    const [lastFact] = await pool.execute('SELECT MAX(id) AS last_id FROM facturas');
    const consecutivo = `FAC-${String((lastFact[0].last_id || 0) + 1).padStart(6, '0')}`;

    const [result] = await pool.execute(
      `INSERT INTO facturas 
       (pedido_id, mesa_id, mesero_id, subtotal, impuesto_porcentaje, impuesto_valor, total, metodo_pago, 
        monto_efectivo, monto_tarjeta, cambio, propina, num_comensales_division, 
        cliente_nit, cliente_razon_social, consecutivo_factura, estado)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [pedido_id, pedido[0].mesa_id, pedido[0].mesero_id, subtotal, impuesto_porcentaje, impuesto_valor, total,
       metodo_pago || 'efectivo', monto_efectivo || 0, monto_tarjeta || 0, cambio, propinaValor,
       num_comensales_division || 1, cliente_nit || null, cliente_razon_social || null, consecutivo, 'pagada']
    );

    // Cerrar pedido
    await pool.execute('UPDATE pedidos SET estado = "cerrado" WHERE id = ?', [pedido_id]);

    // Liberar mesa si no hay otros pedidos abiertos
    const [otros] = await pool.execute(
      'SELECT id FROM pedidos WHERE mesa_id = ? AND estado NOT IN ("cerrado","cancelado")',
      [pedido[0].mesa_id]
    );
    if (otros.length === 0) {
      await pool.execute('UPDATE mesas SET estado = "disponible", mesero_id = NULL WHERE id = ?', [pedido[0].mesa_id]);
    }

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_nuevos) VALUES (?,?,?,?,?)',
      [req.user.id, 'crear', 'facturas', result.insertId, JSON.stringify({ total, metodo_pago, consecutivo })]
    );

    return res.status(201).json({ ok: true, id: result.insertId, consecutivo, total, subtotal, impuesto_valor, cambio });
  } catch (err) {
    console.error('Error generar factura:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/facturacion/:id
async function obtener(req, res) {
  try {
    const [fact] = await pool.execute(`
      SELECT f.*, m.numero AS mesa_numero, u.nombre AS mesero_nombre
      FROM facturas f
      JOIN mesas m ON f.mesa_id = m.id
      LEFT JOIN usuarios u ON f.mesero_id = u.id
      WHERE f.id = ?
    `, [req.params.id]);
    if (fact.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    // Obtener detalle del pedido
    const [detalles] = await pool.execute(`
      SELECT pd.*, pl.nombre AS plato_nombre 
      FROM pedido_detalle pd 
      JOIN platos pl ON pd.plato_id = pl.id 
      WHERE pd.pedido_id = ?
      ORDER BY pd.cuenta_numero
    `, [fact[0].pedido_id]);

    const data = { ...fact[0], detalles };

    // Si hay division, calcular por comensal
    if (data.num_comensales_division > 1) {
      data.total_por_persona = parseFloat((data.total / data.num_comensales_division).toFixed(2));
    }

    return res.json({ ok: true, data });
  } catch (err) {
    console.error('Error obtener factura:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/facturacion/:id/anular
async function anular(req, res) {
  try {
    const [old] = await pool.execute('SELECT * FROM facturas WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    await pool.execute('UPDATE facturas SET estado = "anulada" WHERE id = ?', [req.params.id]);

    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores) VALUES (?,?,?,?,?)',
      [req.user.id, 'anular', 'facturas', req.params.id, JSON.stringify(old[0])]
    );

    return res.json({ ok: true, message: 'Factura anulada' });
  } catch (err) {
    console.error('Error anular factura:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/facturacion/cuenta/:pedidoId — vista previa de la cuenta
async function previaCuenta(req, res) {
  try {
    const pedido_id = req.params.pedidoId;
    const [pedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [pedido_id]);
    if (pedido.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const [detalles] = await pool.execute(`
      SELECT pd.*, pl.nombre AS plato_nombre 
      FROM pedido_detalle pd 
      JOIN platos pl ON pd.plato_id = pl.id 
      WHERE pd.pedido_id = ? AND pd.estado != 'cancelado'
      ORDER BY pd.cuenta_numero
    `, [pedido_id]);

    const subtotal = detalles.reduce((sum, d) => sum + d.cantidad * parseFloat(d.precio_unitario || 0), 0);
    const impuesto = parseFloat((subtotal * 0.08).toFixed(2));
    const total = parseFloat((subtotal + impuesto).toFixed(2));

    // Agrupar por cuenta
    const cuentas = {};
    for (const d of detalles) {
      const num = d.cuenta_numero || 1;
      if (!cuentas[num]) cuentas[num] = { items: [], subtotal: 0 };
      cuentas[num].items.push(d);
      cuentas[num].subtotal += d.cantidad * parseFloat(d.precio_unitario || 0);
    }

    return res.json({ ok: true, data: { pedido_id, subtotal, impuesto, total, items: detalles, detalles, cuentas } });
  } catch (err) {
    console.error('Error previa cuenta:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, generar, obtener, anular, previaCuenta };

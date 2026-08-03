const pool = require('../config/db');

// GET /api/pedidos
async function listar(req, res) {
  try {
    const { estado, mesa_id } = req.query;
    let sql = `
      SELECT p.*, m.numero AS mesa_numero, u.nombre AS mesero_nombre 
      FROM pedidos p 
      JOIN mesas m ON p.mesa_id = m.id 
      LEFT JOIN usuarios u ON p.mesero_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (estado) { sql += ' AND p.estado = ?'; params.push(estado); }
    if (mesa_id) { sql += ' AND p.mesa_id = ?'; params.push(mesa_id); }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar pedidos:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/pedidos/:id
async function obtener(req, res) {
  try {
    const [pedido] = await pool.execute(`
      SELECT p.*, m.numero AS mesa_numero, u.nombre AS mesero_nombre 
      FROM pedidos p 
      JOIN mesas m ON p.mesa_id = m.id 
      LEFT JOIN usuarios u ON p.mesero_id = u.id 
      WHERE p.id = ?
    `, [req.params.id]);
    if (pedido.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Obtener detalle con platos
    const [detalle] = await pool.execute(`
      SELECT pd.*, pl.nombre AS plato_nombre, pl.imagen_url 
      FROM pedido_detalle pd 
      JOIN platos pl ON pd.plato_id = pl.id 
      WHERE pd.pedido_id = ? 
      ORDER BY pd.cuenta_numero, pd.id
    `, [req.params.id]);

    // Obtener modificadores de cada detalle
    for (const d of detalle) {
      const [mods] = await pool.execute(`
        SELECT dm.*, mo.nombre AS modificador_nombre 
        FROM detalle_modificadores dm 
        LEFT JOIN modificadores mo ON dm.modificador_id = mo.id 
        WHERE dm.detalle_id = ?
      `, [d.id]);
      d.modificadores = mods;
    }

    return res.json({ ok: true, data: { ...pedido[0], detalle } });
  } catch (err) {
    console.error('Error obtener pedido:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/pedidos
async function crear(req, res) {
  try {
    const { mesa_id, notas, items } = req.body;
    if (!mesa_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere mesa_id y al menos un item' });
    }

    // Verificar stock de insumos para cada plato
    for (const item of items) {
      const [recetas] = await pool.execute(
        'SELECT r.*, i.nombre AS insumo_nombre, i.stock_actual FROM recetas r JOIN insumos i ON r.insumo_id = i.id WHERE r.plato_id = ?',
        [item.plato_id]
      );
      for (const r of recetas) {
        if (r.stock_actual < r.cantidad * (item.cantidad || 1)) {
          return res.status(400).json({ 
            error: `Insumo insuficiente: ${r.insumo_nombre} para el plato solicitado` 
          });
        }
      }
    }

    const mesero_id = req.user.rol === 'mesero' ? req.user.id : (req.body.mesero_id || req.user.id);

    const [result] = await pool.execute(
      'INSERT INTO pedidos (mesa_id, mesero_id, notas) VALUES (?, ?, ?)',
      [mesa_id, mesero_id, notas || null]
    );
    const pedido_id = result.insertId;

    // Insertar items del detalle
    for (const item of items) {
      const [plato] = await pool.execute('SELECT precio FROM platos WHERE id = ?', [item.plato_id]);
      if (plato.length === 0) continue;

      const [detResult] = await pool.execute(
        'INSERT INTO pedido_detalle (pedido_id, plato_id, cantidad, precio_unitario, notas, cuenta_numero) VALUES (?,?,?,?,?,?)',
        [pedido_id, item.plato_id, item.cantidad || 1, plato[0].precio, item.notas || null, item.cuenta_numero || 1]
      );

      // Insertar modificadores si los tiene
      if (item.modificadores && item.modificadores.length > 0) {
        for (const mod of item.modificadores) {
          await pool.execute(
            'INSERT INTO detalle_modificadores (detalle_id, modificador_id, texto_libre) VALUES (?,?,?)',
            [detResult.insertId, mod.modificador_id || null, mod.texto_libre || null]
          );
        }
      }

      // Descontar insumos
      const [recetas] = await pool.execute('SELECT * FROM recetas WHERE plato_id = ?', [item.plato_id]);
      for (const r of recetas) {
        await pool.execute(
          'UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?',
          [r.cantidad * (item.cantidad || 1), r.insumo_id]
        );
      }
    }

    // Marcar mesa como ocupada
    await pool.execute('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [mesa_id]);

    // Auditoria
    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_nuevos) VALUES (?,?,?,?,?)',
      [req.user.id, 'crear', 'pedidos', pedido_id, JSON.stringify({ mesa_id, items_count: items.length })]
    );

    return res.status(201).json({ ok: true, id: pedido_id });
  } catch (err) {
    console.error('Error crear pedido:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/pedidos/:id/items (agregar items a pedido existente)
async function agregarItems(req, res) {
  try {
    const pedido_id = req.params.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un item' });
    }

    const [pedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ? AND estado IN ("abierto","en_preparacion")', [pedido_id]);
    if (pedido.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado o ya cerrado' });
    }

    for (const item of items) {
      const [plato] = await pool.execute('SELECT precio FROM platos WHERE id = ?', [item.plato_id]);
      if (plato.length === 0) continue;

      const [detResult] = await pool.execute(
        'INSERT INTO pedido_detalle (pedido_id, plato_id, cantidad, precio_unitario, notas, cuenta_numero) VALUES (?,?,?,?,?,?)',
        [pedido_id, item.plato_id, item.cantidad || 1, plato[0].precio, item.notas || null, item.cuenta_numero || 1]
      );

      if (item.modificadores && item.modificadores.length > 0) {
        for (const mod of item.modificadores) {
          await pool.execute(
            'INSERT INTO detalle_modificadores (detalle_id, modificador_id, texto_libre) VALUES (?,?,?)',
            [detResult.insertId, mod.modificador_id || null, mod.texto_libre || null]
          );
        }
      }
    }

    return res.json({ ok: true, message: 'Items agregados' });
  } catch (err) {
    console.error('Error agregar items:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/pedidos/detalle/:id (editar item de pedido)
async function actualizarItem(req, res) {
  try {
    const { cantidad, notas, cuenta_numero } = req.body;
    const [old] = await pool.execute('SELECT * FROM pedido_detalle WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Item no encontrado' });
    if (['listo', 'entregado', 'cancelado'].includes(old[0].estado)) {
      return res.status(400).json({ error: 'Solo se pueden editar items pendientes o en preparacion' });
    }

    const nuevaCantidad = cantidad !== undefined ? parseInt(cantidad) : old[0].cantidad;
    const nuevaCuenta = cuenta_numero !== undefined ? parseInt(cuenta_numero) : old[0].cuenta_numero;
    if (!nuevaCantidad || nuevaCantidad < 1) return res.status(400).json({ error: 'Cantidad invalida' });
    if (!nuevaCuenta || nuevaCuenta < 1) return res.status(400).json({ error: 'Cuenta invalida' });

    await pool.execute(
      'UPDATE pedido_detalle SET cantidad = ?, notas = ?, cuenta_numero = ? WHERE id = ?',
      [nuevaCantidad, notas !== undefined ? notas : old[0].notas, nuevaCuenta, req.params.id]
    );

    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'actualizar_item', 'pedido_detalle', req.params.id, JSON.stringify(old[0]), JSON.stringify({ cantidad: nuevaCantidad, notas, cuenta_numero: nuevaCuenta })]
    );

    return res.json({ ok: true, message: 'Item actualizado' });
  } catch (err) {
    console.error('Error actualizar item pedido:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/pedidos/detalle/:id/cancelar
async function cancelarItem(req, res) {
  try {
    const [old] = await pool.execute('SELECT * FROM pedido_detalle WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Item no encontrado' });
    if (['entregado', 'cancelado'].includes(old[0].estado)) {
      return res.status(400).json({ error: 'El item no se puede cancelar' });
    }

    await pool.execute('UPDATE pedido_detalle SET estado = "cancelado" WHERE id = ?', [req.params.id]);

    const [activos] = await pool.execute(
      'SELECT id FROM pedido_detalle WHERE pedido_id = ? AND estado NOT IN ("entregado","cancelado")',
      [old[0].pedido_id]
    );
    if (activos.length === 0) {
      const [entregados] = await pool.execute(
        'SELECT id FROM pedido_detalle WHERE pedido_id = ? AND estado = "entregado"',
        [old[0].pedido_id]
      );
      const nuevoEstado = entregados.length > 0 ? 'entregado' : 'cancelado';
      await pool.execute('UPDATE pedidos SET estado = ? WHERE id = ? AND estado != "cancelado"', [nuevoEstado, old[0].pedido_id]);
    }

    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'cancelar_item', 'pedido_detalle', req.params.id, JSON.stringify({ estado: old[0].estado }), JSON.stringify({ estado: 'cancelado' })]
    );

    return res.json({ ok: true, message: 'Item cancelado' });
  } catch (err) {
    console.error('Error cancelar item pedido:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/pedidos/:id/estado
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    const [old] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    await pool.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);

    if (estado === 'cancelado') {
      await pool.execute(
        'UPDATE pedido_detalle SET estado = "cancelado" WHERE pedido_id = ? AND estado NOT IN ("entregado","cancelado")',
        [req.params.id]
      );
    }

    if (estado === 'cerrado' || estado === 'cancelado') {
      // Verificar si la mesa tiene otros pedidos abiertos
      const [otros] = await pool.execute(
        'SELECT id FROM pedidos WHERE mesa_id = ? AND id != ? AND estado NOT IN ("cerrado","cancelado")',
        [old[0].mesa_id, req.params.id]
      );
      if (otros.length === 0) {
        await pool.execute('UPDATE mesas SET estado = "disponible", mesero_id = NULL WHERE id = ?', [old[0].mesa_id]);
      }
    }

    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'cambiar_estado', 'pedidos', req.params.id, JSON.stringify({ estado: old[0].estado }), JSON.stringify({ estado })]
    );

    return res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    console.error('Error cambiar estado pedido:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/pedidos/detalle/:id/dividir-cuenta
async function dividirCuenta(req, res) {
  try {
    const { cuenta_numero } = req.body;
    await pool.execute('UPDATE pedido_detalle SET cuenta_numero = ? WHERE id = ?', [cuenta_numero, req.params.id]);
    return res.json({ ok: true, message: 'Cuenta actualizada' });
  } catch (err) {
    console.error('Error dividir cuenta:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listar, obtener, crear, agregarItems, actualizarItem, cancelarItem, cambiarEstado, dividirCuenta };

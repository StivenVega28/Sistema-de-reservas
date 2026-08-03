const pool = require('../config/db');

// ===================== CATEGORIAS =====================

// GET /api/menu/categorias
async function listarCategorias(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM categorias ORDER BY nombre');
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar categorias:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/menu/categorias
async function crearCategoria(req, res) {
  try {
    const { nombre, descripcion } = req.body;
    const [result] = await pool.execute('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion || null]);
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear categoria:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// ===================== PLATOS =====================

// GET /api/menu/platos
async function listarPlatos(req, res) {
  try {
    const { categoria_id, disponible } = req.query;
    let sql = `
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM platos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    if (categoria_id) { sql += ' AND p.categoria_id = ?'; params.push(categoria_id); }
    if (disponible !== undefined) { sql += ' AND p.disponible = ?'; params.push(disponible); }
    sql += ' ORDER BY c.nombre, p.nombre';

    const [rows] = await pool.execute(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar platos:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/menu/platos
async function crearPlato(req, res) {
  try {
    const { nombre, descripcion, precio, categoria_id, imagen_url } = req.body;
    if (!nombre || !precio) return res.status(400).json({ error: 'nombre y precio requeridos' });

    const [result] = await pool.execute(
      'INSERT INTO platos (nombre, descripcion, precio, categoria_id, imagen_url) VALUES (?,?,?,?,?)',
      [nombre, descripcion || null, precio, categoria_id || null, imagen_url || null]
    );
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear plato:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/menu/platos/:id
async function actualizarPlato(req, res) {
  try {
    const { nombre, descripcion, precio, categoria_id, imagen_url, disponible, agotado } = req.body;
    await pool.execute(
      `UPDATE platos SET 
        nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), 
        precio = COALESCE(?, precio), categoria_id = COALESCE(?, categoria_id),
        imagen_url = COALESCE(?, imagen_url), disponible = COALESCE(?, disponible), 
        agotado = COALESCE(?, agotado)
       WHERE id = ?`,
      [nombre, descripcion, precio, categoria_id, imagen_url, disponible, agotado, req.params.id]
    );

    await pool.execute(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, datos_nuevos) VALUES (?,?,?,?,?)',
      [req.user.id, 'actualizar', 'platos', req.params.id, JSON.stringify(req.body)]
    );

    return res.json({ ok: true, message: 'Plato actualizado' });
  } catch (err) {
    console.error('Error actualizar plato:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// DELETE /api/menu/platos/:id (soft delete: disponible=0)
async function eliminarPlato(req, res) {
  try {
    await pool.execute('UPDATE platos SET disponible = 0 WHERE id = ?', [req.params.id]);
    return res.json({ ok: true, message: 'Plato desactivado' });
  } catch (err) {
    console.error('Error eliminar plato:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// ===================== MODIFICADORES =====================

// GET /api/menu/modificadores
async function listarModificadores(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM modificadores WHERE activo = 1 ORDER BY tipo, nombre');
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar modificadores:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/menu/modificadores
async function crearModificador(req, res) {
  try {
    const { nombre, tipo } = req.body;
    const [result] = await pool.execute('INSERT INTO modificadores (nombre, tipo) VALUES (?, ?)', [nombre, tipo || 'nota']);
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear modificador:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// ===================== INSUMOS =====================

// GET /api/menu/insumos
async function listarInsumos(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM insumos ORDER BY nombre');
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error listar insumos:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/menu/insumos
async function crearInsumo(req, res) {
  try {
    const { nombre, unidad, stock_actual, stock_minimo } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO insumos (nombre, unidad, stock_actual, stock_minimo) VALUES (?,?,?,?)',
      [nombre, unidad || 'unidad', stock_actual || 0, stock_minimo || 0]
    );
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear insumo:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/menu/insumos/:id
async function actualizarInsumo(req, res) {
  try {
    const { nombre, unidad, stock_actual, stock_minimo } = req.body;
    await pool.execute(
      'UPDATE insumos SET nombre = COALESCE(?,nombre), unidad = COALESCE(?,unidad), stock_actual = COALESCE(?,stock_actual), stock_minimo = COALESCE(?,stock_minimo) WHERE id = ?',
      [nombre, unidad, stock_actual, stock_minimo, req.params.id]
    );
    return res.json({ ok: true, message: 'Insumo actualizado' });
  } catch (err) {
    console.error('Error actualizar insumo:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// POST /api/menu/recetas
async function crearReceta(req, res) {
  try {
    const { plato_id, insumo_id, cantidad } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO recetas (plato_id, insumo_id, cantidad) VALUES (?,?,?)',
      [plato_id, insumo_id, cantidad]
    );
    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error crear receta:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/menu/recetas/:platoId
async function obtenerRecetas(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT r.*, i.nombre AS insumo_nombre, i.unidad, i.stock_actual FROM recetas r JOIN insumos i ON r.insumo_id = i.id WHERE r.plato_id = ?',
      [req.params.platoId]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error obtener recetas:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { 
  listarCategorias, crearCategoria,
  listarPlatos, crearPlato, actualizarPlato, eliminarPlato,
  listarModificadores, crearModificador,
  listarInsumos, crearInsumo, actualizarInsumo,
  crearReceta, obtenerRecetas
};

/**
 * Script de seed — carga datos demo en la base de datos.
 * Ejecutar: npm run seed
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  console.log('Conectado a MySQL. Ejecutando schema...');

  // Leer y ejecutar schema
  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await connection.query(schema);
  console.log('Schema ejecutado correctamente.');

  // Usar la base de datos
  await connection.query('USE restaurante_db');

  // ======== USUARIOS DEMO ========
  const salt = await bcrypt.genSalt(10);
  const usuarios = [
    { username: 'admin', password: await bcrypt.hash('admin123', salt), nombre: 'Administrador General', rol: 'administrador' },
    { username: 'mesero', password: await bcrypt.hash('mesero123', salt), nombre: 'Carlos Mesero', rol: 'mesero' },
    { username: 'cocina', password: await bcrypt.hash('cocina123', salt), nombre: 'Maria Cocina', rol: 'cocina' },
    { username: 'despacho', password: await bcrypt.hash('despacho123', salt), nombre: 'Pedro Despacho', rol: 'despachador' },
  ];

  // Verificar si ya existen usuarios
  const [existentes] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
  if (existentes[0].total === 0) {
    for (const u of usuarios) {
      await connection.execute(
        'INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
        [u.username, u.password, u.nombre, u.rol]
      );
    }
    console.log('4 usuarios demo creados.');
  } else {
    console.log('Usuarios ya existen, saltando...');
  }

  // ======== CATEGORIAS ========
  const [catExist] = await connection.execute('SELECT COUNT(*) as total FROM categorias');
  if (catExist[0].total === 0) {
    const categorias = [
      { nombre: 'Entradas', descripcion: 'Platos de entrada y aperitivos' },
      { nombre: 'Platos Fuertes', descripcion: 'Platos principales' },
      { nombre: 'Postres', descripcion: 'Postres y dulces' },
      { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos' },
    ];
    for (const c of categorias) {
      await connection.execute('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [c.nombre, c.descripcion]);
    }
    console.log('4 categorias creadas.');
  }

  // ======== PLATOS ========
  const [platExist] = await connection.execute('SELECT COUNT(*) as total FROM platos');
  if (platExist[0].total === 0) {
    const platos = [
      { nombre: 'Empanadas (x3)', descripcion: 'Empanadas criollas con aji', precio: 12000, categoria_id: 1 },
      { nombre: 'Sopa del Dia', descripcion: 'Sopa casera del dia', precio: 10000, categoria_id: 1 },
      { nombre: 'Bandeja Paisa', descripcion: 'Plato tipico colombiano con frijoles, arroz, carne, chicharron, huevo, platano y aguacate', precio: 28000, categoria_id: 2 },
      { nombre: 'Filete de Salmon', descripcion: 'Salmon a la plancha con vegetales y pure de papa', precio: 35000, categoria_id: 2 },
      { nombre: 'Pollo a la Parrilla', descripcion: 'Pechuga de pollo con ensalada y papas', precio: 22000, categoria_id: 2 },
      { nombre: 'Arroz con Mariscos', descripcion: 'Arroz con camarones, pulpo y mejillones', precio: 32000, categoria_id: 2 },
      { nombre: 'Tres Leches', descripcion: 'Postre de tres leches con canela', precio: 9000, categoria_id: 3 },
      { nombre: 'Limonada Natural', descripcion: 'Limonada fresca hecha al momento', precio: 5000, categoria_id: 4 },
    ];
    for (const p of platos) {
      await connection.execute(
        'INSERT INTO platos (nombre, descripcion, precio, categoria_id) VALUES (?, ?, ?, ?)',
        [p.nombre, p.descripcion, p.precio, p.categoria_id]
      );
    }
    console.log('8 platos creados.');
  }

  // ======== MODIFICADORES ========
  const [modExist] = await connection.execute('SELECT COUNT(*) as total FROM modificadores');
  if (modExist[0].total === 0) {
    const modificadores = [
      { nombre: 'Sin cebolla', tipo: 'ingrediente' },
      { nombre: 'Sin picante', tipo: 'ingrediente' },
      { nombre: 'Extra queso', tipo: 'ingrediente' },
      { nombre: 'Termino medio', tipo: 'preparacion' },
      { nombre: 'Bien asado', tipo: 'preparacion' },
      { nombre: 'Al vapor', tipo: 'preparacion' },
      { nombre: 'Para llevar', tipo: 'nota' },
      { nombre: 'Urgente', tipo: 'nota' },
    ];
    for (const m of modificadores) {
      await connection.execute('INSERT INTO modificadores (nombre, tipo) VALUES (?, ?)', [m.nombre, m.tipo]);
    }
    console.log('8 modificadores creados.');
  }

  // ======== MESAS ========
  const [mesExist] = await connection.execute('SELECT COUNT(*) as total FROM mesas');
  if (mesExist[0].total === 0) {
    const mesas = [
      { numero: 1, capacidad: 2, pos_x: 50, pos_y: 50 },
      { numero: 2, capacidad: 2, pos_x: 200, pos_y: 50 },
      { numero: 3, capacidad: 4, pos_x: 350, pos_y: 50 },
      { numero: 4, capacidad: 4, pos_x: 500, pos_y: 50 },
      { numero: 5, capacidad: 6, pos_x: 50, pos_y: 200 },
      { numero: 6, capacidad: 6, pos_x: 200, pos_y: 200 },
      { numero: 7, capacidad: 8, pos_x: 350, pos_y: 200 },
      { numero: 8, capacidad: 8, pos_x: 500, pos_y: 200 },
    ];
    for (const m of mesas) {
      await connection.execute(
        'INSERT INTO mesas (numero, capacidad, pos_x, pos_y) VALUES (?, ?, ?, ?)',
        [m.numero, m.capacidad, m.pos_x, m.pos_y]
      );
    }
    console.log('8 mesas creadas.');
  }

  // ======== INSUMOS BASICOS ========
  const [insExist] = await connection.execute('SELECT COUNT(*) as total FROM insumos');
  if (insExist[0].total === 0) {
    const insumos = [
      { nombre: 'Arroz', unidad: 'kg', stock_actual: 100, stock_minimo: 10 },
      { nombre: 'Frijoles', unidad: 'kg', stock_actual: 50, stock_minimo: 5 },
      { nombre: 'Pollo', unidad: 'kg', stock_actual: 30, stock_minimo: 5 },
      { nombre: 'Salmon', unidad: 'kg', stock_actual: 20, stock_minimo: 3 },
      { nombre: 'Papa', unidad: 'kg', stock_actual: 50, stock_minimo: 10 },
      { nombre: 'Cebolla', unidad: 'kg', stock_actual: 30, stock_minimo: 5 },
      { nombre: 'Leche', unidad: 'litro', stock_actual: 40, stock_minimo: 5 },
      { nombre: 'Limon', unidad: 'kg', stock_actual: 25, stock_minimo: 5 },
    ];
    for (const i of insumos) {
      await connection.execute(
        'INSERT INTO insumos (nombre, unidad, stock_actual, stock_minimo) VALUES (?, ?, ?, ?)',
        [i.nombre, i.unidad, i.stock_actual, i.stock_minimo]
      );
    }
    console.log('8 insumos creados.');
  }

  console.log('\nSeed completado exitosamente!');
  console.log('Usuarios demo:');
  console.log('  admin / admin123');
  console.log('  mesero / mesero123');
  console.log('  cocina / cocina123');
  console.log('  despacho / despacho123');

  await connection.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});

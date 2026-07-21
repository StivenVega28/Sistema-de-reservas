/**
 * seed.js
 * Genera datos iniciales (mesas, meseros, platos, usuarios) SOLO si
 * localStorage aún no tiene información. Se ejecuta una vez
 * al cargar cualquier vista gracias a app.js -> initApp().
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { generarSalt, hashPassword } from '../utils/crypto.js';

const mesasSeed = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  numero: i + 1,
  capacidad: (i % 3) + 2,
  estado: 'libre', // libre | reservada | ocupada
}));

const meserosSeed = [
  { id: 1, nombre: 'Camila Ríos' },
  { id: 2, nombre: 'Julián Torres' },
  { id: 3, nombre: 'Andrea Gómez' },
];

const platosSeed = [
  { id: 1, nombre: 'Bandeja Paisa', precio: 28000, categoria: 'Fuerte' },
  { id: 2, nombre: 'Ajiaco', precio: 22000, categoria: 'Sopa' },
  { id: 3, nombre: 'Sancocho', precio: 24000, categoria: 'Sopa' },
  { id: 4, nombre: 'Arepa con Queso', precio: 8000, categoria: 'Entrada' },
  { id: 5, nombre: 'Limonada de Coco', precio: 9000, categoria: 'Bebida' },
  { id: 6, nombre: 'Gaseosa', precio: 5000, categoria: 'Bebida' },
];

const USUARIOS_DEMO = [
  { usuario: 'admin', password: 'Admin123', rol: 'admin' },
  { usuario: 'mesero', password: 'Mesero123', rol: 'mesero' },
  { usuario: 'cocina', password: 'Cocina123', rol: 'cocina' },
  { usuario: 'despacho', password: 'Despacho123', rol: 'despacho' },
];

async function crearUsuarioSeguro({ usuario, password, rol }) {
  const salt = generarSalt();
  const hash = await hashPassword(password, salt);
  return {
    usuario,
    salt,
    hash,
    rol,
    intentosFallidos: 0,
    bloqueadoHasta: null,
  };
}

export async function seedDatabase() {
  if (!Storage.get(DB_KEYS.MESAS)) Storage.set(DB_KEYS.MESAS, mesasSeed);
  if (!Storage.get(DB_KEYS.MESEROS)) Storage.set(DB_KEYS.MESEROS, meserosSeed);
  if (!Storage.get(DB_KEYS.PLATOS)) Storage.set(DB_KEYS.PLATOS, platosSeed);
  if (!Storage.get(DB_KEYS.PEDIDOS)) Storage.set(DB_KEYS.PEDIDOS, []);
  if (!Storage.get(DB_KEYS.USUARIOS)) {
    const usuarios = await Promise.all(USUARIOS_DEMO.map(crearUsuarioSeguro));
    Storage.set(DB_KEYS.USUARIOS, usuarios);
  }
}

/**
 * seed.js
 * Genera datos iniciales (mesas, meseros, platos) SOLO si
 * localStorage aún no tiene información. Se ejecuta una vez
 * al cargar cualquier vista gracias a app.js -> initApp().
 */

import { Storage, DB_KEYS } from '../utils/storage.js';

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

export function seedDatabase() {
  if (!Storage.get(DB_KEYS.MESAS)) Storage.set(DB_KEYS.MESAS, mesasSeed);
  if (!Storage.get(DB_KEYS.MESEROS)) Storage.set(DB_KEYS.MESEROS, meserosSeed);
  if (!Storage.get(DB_KEYS.PLATOS)) Storage.set(DB_KEYS.PLATOS, platosSeed);
  if (!Storage.get(DB_KEYS.PEDIDOS)) Storage.set(DB_KEYS.PEDIDOS, []);
}

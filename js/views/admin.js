/**
 * admin.js
 * Vista Admin: consolida métricas del negocio a partir de
 * rr_mesas, rr_pedidos, rr_meseros y rr_platos:
 *  - N° de mesas, N° de reservas (pedidos totales), ventas totales,
 *    propinas totales, subtotal (ventas + propinas).
 *  - Tabla de platos vendidos (cantidad y total generado).
 *  - Tabla de propinas acumuladas por mesero.
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { calcularSubtotalPedido } from '../data/models.js';

const cardsContainer = document.getElementById('admin-cards');
const tablaPlatos = document.getElementById('tabla-platos');
const tablaPropinas = document.getElementById('tabla-propinas');

function formatoMoneda(valor) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function render() {
  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const meseros = Storage.get(DB_KEYS.MESEROS) || [];
  const platos = Storage.get(DB_KEYS.PLATOS) || [];
  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];

  const pedidosEntregados = pedidos.filter((p) => p.estado === 'entregado');

  const ventasTotales = pedidosEntregados.reduce(
    (acc, p) => acc + calcularSubtotalPedido(p), 0
  );
  const propinasTotales = pedidosEntregados.reduce((acc, p) => acc + (p.propina || 0), 0);
  const subtotalGeneral = ventasTotales + propinasTotales;

  const platosVendidosTotal = pedidosEntregados.reduce(
    (acc, p) => acc + p.items.reduce((s, it) => s + it.cantidad, 0), 0
  );

  cardsContainer.innerHTML = `
    <div class="card">
      <span class="card__label">Mesas registradas</span>
      <span class="card__value">${mesas.length}</span>
    </div>
    <div class="card card--secondary">
      <span class="card__label">Reservas / pedidos totales</span>
      <span class="card__value">${pedidos.length}</span>
    </div>
    <div class="card card--warning">
      <span class="card__label">Platos vendidos</span>
      <span class="card__value">${platosVendidosTotal}</span>
    </div>
    <div class="card">
      <span class="card__label">Ventas totales</span>
      <span class="card__value">${formatoMoneda(ventasTotales)}</span>
    </div>
    <div class="card card--secondary">
      <span class="card__label">Propinas totales</span>
      <span class="card__value">${formatoMoneda(propinasTotales)}</span>
    </div>
    <div class="card card--danger">
      <span class="card__label">Subtotal (ventas + propinas)</span>
      <span class="card__value">${formatoMoneda(subtotalGeneral)}</span>
    </div>
  `;

  const resumenPlatos = {};
  pedidosEntregados.forEach((p) => {
    p.items.forEach((it) => {
      if (!resumenPlatos[it.platoId]) {
        resumenPlatos[it.platoId] = { nombre: it.nombre, cantidad: 0, total: 0 };
      }
      resumenPlatos[it.platoId].cantidad += it.cantidad;
      resumenPlatos[it.platoId].total += it.cantidad * it.precio;
    });
  });

  const filasPlatos = Object.values(resumenPlatos);
  tablaPlatos.innerHTML = filasPlatos.length
    ? filasPlatos
        .map(
          (r) => `<tr><td>${r.nombre}</td><td>${r.cantidad}</td><td>${formatoMoneda(r.total)}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="empty-state">Aún no hay ventas registradas</td></tr>`;

  const resumenPropinas = {};
  meseros.forEach((m) => (resumenPropinas[m.id] = { nombre: m.nombre, pedidos: 0, propinas: 0 }));
  pedidosEntregados.forEach((p) => {
    if (!resumenPropinas[p.meseroId]) return;
    resumenPropinas[p.meseroId].pedidos += 1;
    resumenPropinas[p.meseroId].propinas += p.propina || 0;
  });

  tablaPropinas.innerHTML = Object.values(resumenPropinas)
    .map(
      (r) => `<tr><td>${r.nombre}</td><td>${r.pedidos}</td><td>${formatoMoneda(r.propinas)}</td></tr>`
    )
    .join('');
}

window.addEventListener('storage', render);
render();

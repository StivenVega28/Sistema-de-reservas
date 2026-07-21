/**
 * cocina.js
 * Vista Cocina: muestra los pedidos en estado "pendiente" o "cocina".
 * El cocinero puede marcar un pedido como "listo", lo que lo envía
 * automáticamente a la vista Despacho.
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { showToast } from '../app.js';

const contenedor = document.getElementById('pedidos-cocina');

function obtenerNombreMesa(mesaId) {
  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const mesa = mesas.find((m) => m.id === mesaId);
  return mesa ? `Mesa ${mesa.numero}` : 'Mesa desconocida';
}

function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function render() {
  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  const pendientes = pedidos.filter((p) => p.estado === 'pendiente' || p.estado === 'cocina');

  if (pendientes.length === 0) {
    contenedor.innerHTML = '<p class="empty-state">No hay pedidos pendientes por cocinar 🎉</p>';
    return;
  }

  contenedor.innerHTML = pendientes
    .map(
      (p) => `
      <div class="pedido-card" data-id="${p.id}">
        <div class="pedido-card__header">
          <span class="pedido-card__mesa">${obtenerNombreMesa(p.mesaId)}</span>
          <span class="pedido-card__hora">${formatoHora(p.fechaCreacion)}</span>
        </div>
        <span class="badge badge--pendiente">${p.estado}</span>
        <ul class="pedido-card__items">
          ${p.items.map((it) => `<li>${it.cantidad} × ${it.nombre}</li>`).join('')}
        </ul>
        <button class="btn btn--secondary btn--block" data-action="listo" data-id="${p.id}">
          Marcar como listo
        </button>
      </div>`
    )
    .join('');
}

contenedor.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="listo"]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  const pedido = pedidos.find((p) => p.id === id);
  pedido.estado = 'listo';
  Storage.set(DB_KEYS.PEDIDOS, pedidos);
  showToast('Pedido marcado como listo, enviado a despacho');
  render();
});

window.addEventListener('storage', render);
render();

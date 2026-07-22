/**
 * cocina.js
 * Vista Cocina: muestra pedidos en estado "preparacion" y "listo".
 * El cocinero puede marcar un pedido como "listo", quedando disponible
 * para despacho.
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { showToast } from '../app.js';
import { requireAuth } from '../auth.js';

requireAuth(['admin', 'cocina']);

const contenedorPreparacion = document.getElementById('pedidos-preparacion');
const contenedorListos = document.getElementById('pedidos-listos');

function obtenerNombreMesa(mesaId) {
  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const mesa = mesas.find((m) => m.id === mesaId);
  return mesa ? `Mesa ${mesa.numero}` : 'Mesa desconocida';
}

function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function renderBloque(pedidos, contenedor, tituloVacio) {
  if (pedidos.length === 0) {
    contenedor.innerHTML = `<p class="empty-state">${tituloVacio}</p>`;
    return;
  }

  contenedor.innerHTML = pedidos
    .map(
      (p) => `
      <div class="pedido-card" data-id="${p.id}">
        <div class="pedido-card__header">
          <span class="pedido-card__mesa">${obtenerNombreMesa(p.mesaId)}</span>
          <span class="pedido-card__hora">${formatoHora(p.fechaCreacion)}</span>
        </div>
        <span class="badge ${p.estado === 'listo' ? 'badge--listo' : 'badge--preparacion'}">${p.estado}</span>
        <ul class="pedido-card__items">
          ${p.items.map((it) => `<li>${it.cantidad} × ${it.nombre}</li>`).join('')}
        </ul>
        ${p.estado === 'preparacion' ? `
          <button class="btn btn--secondary btn--block" data-action="listo" data-id="${p.id}">
            Marcar como listo
          </button>
        ` : ''}
      </div>`
    )
    .join('');
}

function render() {
  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  const enPreparacion = pedidos.filter((p) => p.estado === 'preparacion');
  const listos = pedidos.filter((p) => p.estado === 'listo');

  renderBloque(enPreparacion, contenedorPreparacion, 'No hay pedidos en preparación 🎉');
  renderBloque(listos, contenedorListos, 'No hay pedidos listos');
}

function actualizarEstadoPedido(id, estado) {
  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  const pedido = pedidos.find((p) => p.id === id);
  if (!pedido) return;
  pedido.estado = estado;
  Storage.set(DB_KEYS.PEDIDOS, pedidos);
}

contenedorPreparacion.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="listo"]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  actualizarEstadoPedido(id, 'listo');
  showToast('Pedido marcado como listo, disponible para despacho');
  render();
});

window.addEventListener('storage', render);
render();
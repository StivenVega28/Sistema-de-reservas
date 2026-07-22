/**
 * despacho.js
 * Vista Despacho: muestra los pedidos en estado "listo" (preparados
 * por cocina) y permite marcarlos como "entregado". Al entregar:
 *  - Se registra fechaEntrega y una propina (simulada/opcional).
 *  - La mesa vuelve a estado "libre" para nuevas reservas.
 */

import { requireAuth } from '../auth.js';
import { Storage, DB_KEYS } from '../utils/storage.js';
import { showToast } from '../app.js';

requireAuth(['admin', 'mesero', 'despacho']);

const contenedor = document.getElementById('pedidos-despacho');

if (!contenedor) {
  console.error('Falta elemento DOM necesario en despacho.html');
}

function obtenerNombreMesa(mesaId) {
  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const mesa = mesas.find((m) => m.id === mesaId);
  return mesa ? `Mesa ${mesa.numero}` : 'Mesa desconocida';
}

function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function render() {
  if (!contenedor) return;
  
  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  const listos = pedidos.filter((p) => p.estado === 'listo');

  if (listos.length === 0) {
    contenedor.innerHTML = '<p class="empty-state">No hay pedidos listos para entregar</p>';
    return;
  }

  contenedor.innerHTML = listos
    .map(
      (p) => `
      <div class="pedido-card pedido-card--listo" data-id="${p.id}">
        <div class="pedido-card__header">
          <span class="pedido-card__mesa">${obtenerNombreMesa(p.mesaId)}</span>
          <span class="pedido-card__hora">${formatoHora(p.fechaCreacion)}</span>
        </div>
        <span class="badge badge--listo">${p.estado}</span>
        <ul class="pedido-card__items">
          ${p.items.map((it) => `<li>${it.cantidad} × ${it.nombre}</li>`).join('')}
        </ul>
        <div class="form-group">
          <label class="form-label">Propina ($)</label>
          <input type="number" min="0" step="1000" value="0" class="form-control" data-propina="${p.id}" />
        </div>
        <button class="btn btn--block" data-action="entregar" data-id="${p.id}">
          Marcar como entregado
        </button>
      </div>`
    )
    .join('');
}

contenedor.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="entregar"]');
  if (!btn) return;
  const id = Number(btn.dataset.id);

  const propinaInput = contenedor.querySelector(`input[data-propina="${id}"]`);
  const propina = Number(propinaInput.value) || 0;

  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  const pedido = pedidos.find((p) => p.id === id);
  pedido.estado = 'entregado';
  pedido.propina = propina;
  pedido.fechaEntrega = new Date().toISOString();
  Storage.set(DB_KEYS.PEDIDOS, pedidos);

  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const mesa = mesas.find((m) => m.id === pedido.mesaId);
  if (mesa) mesa.estado = 'libre';
  Storage.set(DB_KEYS.MESAS, mesas);

  showToast('Pedido entregado. Mesa liberada.');
  render();
});

window.addEventListener('storage', render);
render();

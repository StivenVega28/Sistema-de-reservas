/**
 * mesero.js
 * Vista Mesero: permite ver el estado de las mesas, seleccionar
 * una mesa disponible, elegir mesero, escoger platos y cantidades,
 * y confirmar un pedido. Al confirmar:
 *  - La mesa pasa a estado "ocupada" (rr_mesas).
 *  - Se crea un pedido en estado "pendiente" (rr_pedidos) que
 *    luego verá la vista Cocina.
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { crearPedido, calcularSubtotalPedido } from '../data/models.js';
import { showToast } from '../app.js';

const mesasGrid = document.getElementById('mesas-grid');
const selectMesero = document.getElementById('select-mesero');
const platosList = document.getElementById('platos-list');
const subtotalPreview = document.getElementById('subtotal-preview');
const btnCrearPedido = document.getElementById('btn-crear-pedido');
const formPedido = document.getElementById('form-pedido');

let mesaSeleccionada = null;
let cantidades = {}; // { platoId: cantidad }

function formatoMoneda(valor) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function renderMesas() {
  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  mesasGrid.innerHTML = mesas
    .map(
      (m) => `
      <div class="mesa mesa--${m.estado} ${mesaSeleccionada === m.id ? 'mesa--selected' : ''}"
           data-id="${m.id}" role="button" tabindex="0">
        Mesa ${m.numero}<br /><small>${m.capacidad} pax</small>
      </div>`
    )
    .join('');
}

function renderMeseros() {
  const meseros = Storage.get(DB_KEYS.MESEROS) || [];
  selectMesero.innerHTML =
    '<option value="" disabled selected>Seleccione un mesero</option>' +
    meseros.map((m) => `<option value="${m.id}">${m.nombre}</option>`).join('');
}

function renderPlatos() {
  const platos = Storage.get(DB_KEYS.PLATOS) || [];
  platosList.innerHTML = platos
    .map(
      (p) => `
      <div class="plato-item">
        <div class="plato-item__info">
          <span class="plato-item__nombre">${p.nombre}</span>
          <span class="plato-item__precio">${formatoMoneda(p.precio)}</span>
        </div>
        <div class="plato-item__cantidad">
          <button type="button" class="btn btn--sm btn--outline" data-action="menos" data-id="${p.id}">-</button>
          <input type="number" min="0" value="0" data-id="${p.id}" readonly />
          <button type="button" class="btn btn--sm btn--outline" data-action="mas" data-id="${p.id}">+</button>
        </div>
      </div>`
    )
    .join('');
}

function actualizarSubtotal() {
  const platos = Storage.get(DB_KEYS.PLATOS) || [];
  let subtotal = 0;
  Object.entries(cantidades).forEach(([id, cant]) => {
    const plato = platos.find((p) => p.id === Number(id));
    if (plato) subtotal += plato.precio * cant;
  });
  subtotalPreview.textContent = formatoMoneda(subtotal);
  validarFormulario();
}

function validarFormulario() {
  const hayPlatos = Object.values(cantidades).some((c) => c > 0);
  btnCrearPedido.disabled = !(mesaSeleccionada && selectMesero.value && hayPlatos);
}

mesasGrid.addEventListener('click', (e) => {
  const mesaEl = e.target.closest('.mesa');
  if (!mesaEl) return;
  const id = Number(mesaEl.dataset.id);
  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const mesa = mesas.find((m) => m.id === id);
  if (mesa.estado !== 'libre') {
    showToast('Esa mesa no está disponible');
    return;
  }
  mesaSeleccionada = id;
  renderMesas();
  validarFormulario();
});

platosList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const delta = btn.dataset.action === 'mas' ? 1 : -1;
  const actual = cantidades[id] || 0;
  const nuevo = Math.max(0, actual + delta);
  cantidades[id] = nuevo;
  platosList.querySelector(`input[data-id="${id}"]`).value = nuevo;
  actualizarSubtotal();
});

selectMesero.addEventListener('change', validarFormulario);

formPedido.addEventListener('submit', (e) => {
  e.preventDefault();

  const platos = Storage.get(DB_KEYS.PLATOS) || [];
  const items = Object.entries(cantidades)
    .filter(([, cant]) => cant > 0)
    .map(([id, cant]) => {
      const plato = platos.find((p) => p.id === Number(id));
      return { platoId: plato.id, nombre: plato.nombre, precio: plato.precio, cantidad: cant };
    });

  const pedido = crearPedido({
    mesaId: mesaSeleccionada,
    meseroId: Number(selectMesero.value),
    items,
  });

  const pedidos = Storage.get(DB_KEYS.PEDIDOS) || [];
  pedidos.push(pedido);
  Storage.set(DB_KEYS.PEDIDOS, pedidos);

  const mesas = Storage.get(DB_KEYS.MESAS) || [];
  const mesa = mesas.find((m) => m.id === mesaSeleccionada);
  mesa.estado = 'ocupada';
  Storage.set(DB_KEYS.MESAS, mesas);

  showToast(`Pedido creado. Subtotal: ${formatoMoneda(calcularSubtotalPedido(pedido))}`);

  cantidades = {};
  mesaSeleccionada = null;
  formPedido.reset();
  renderMesas();
  renderPlatos();
  actualizarSubtotal();
});

renderMesas();
renderMeseros();
renderPlatos();

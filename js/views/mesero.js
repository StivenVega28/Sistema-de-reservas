/**
 * mesero.js
 * Vista Mesero: mesas libres arriba, ocupadas abajo.
 * - Si seleccionas una mesa libre, puedes crear un pedido.
 * - Si seleccionas una mesa ocupada, se carga su pedido para editarlo.
 * - Desde la edición puedes agregar/quitar platos o liberar la mesa.
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { crearPedido, calcularSubtotalPedido } from '../data/models.js';
import { showToast } from '../app.js';
import { requireAuth } from '../auth.js';

requireAuth(['admin', 'mesero']);

const mesasGrid = document.getElementById('mesas-grid');
const mesasOcupadas = document.getElementById('mesas-ocupadas');
const selectMesero = document.getElementById('select-mesero');
const platosList = document.getElementById('platos-list');
const subtotalPreview = document.getElementById('subtotal-preview');
const btnCrearPedido = document.getElementById('btn-crear-pedido');
const formPedido = document.getElementById('form-pedido');
const tituloPedido = document.getElementById('titulo-pedido');
const btnLiberarMesa = document.getElementById('btn-liberar-mesa');

let mesaSeleccionada = null;
let pedidoActualId = null;
let cantidades = {};
let modoEdicion = false;

function formatoMoneda(valor) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function obtenerMesas() {
  return Storage.get(DB_KEYS.MESAS) || [];
}

function guardarMesas(mesas) {
  Storage.set(DB_KEYS.MESAS, mesas);
}

function obtenerPedidos() {
  return Storage.get(DB_KEYS.PEDIDOS) || [];
}

function guardarPedidos(pedidos) {
  Storage.set(DB_KEYS.PEDIDOS, pedidos);
}

function obtenerPedidoPorMesa(mesaId) {
  const pedidos = obtenerPedidos();
  return pedidos.find((p) => p.mesaId === mesaId && p.estado !== 'entregado');
}

function renderMesas() {
  const mesas = obtenerMesas();
  const libres = mesas.filter((m) => m.estado === 'libre');
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada');

  mesasGrid.innerHTML = libres.length
    ? libres.map((m) => `
        <div class="mesa mesa--${m.estado} ${mesaSeleccionada === m.id ? 'mesa--selected' : ''}" data-id="${m.id}" role="button" tabindex="0">
          Mesa ${m.numero}<br><small>${m.capacidad} Personas</small>
        </div>`).join('')
    : '<p class="empty-state">No hay mesas disponibles</p>';

  mesasOcupadas.innerHTML = ocupadas.length
    ? ocupadas.map((m) => `
        <div class="mesa mesa--ocupada mesa--ocupada-box ${mesaSeleccionada === m.id ? 'mesa--selected' : ''}" data-id="${m.id}" role="button" tabindex="0">
          Mesa ${m.numero}<br><small>Ocupada</small>
        </div>`).join('')
    : '<p class="empty-state">No hay mesas ocupadas</p>';
}

function renderMeseros() {
  const meseros = Storage.get(DB_KEYS.MESEROS) || [];
  selectMesero.innerHTML = '<option value="" disabled selected>Seleccione un mesero</option>' +
    meseros.map((m) => `<option value="${m.id}">${m.nombre}</option>`).join('');
}

function renderPlatos() {
  const platos = Storage.get(DB_KEYS.PLATOS) || [];
  platosList.innerHTML = platos.map((p) => `
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
    </div>`).join('');
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

function resetFormulario() {
  cantidades = {};
  pedidoActualId = null;
  modoEdicion = false;
  mesaSeleccionada = null;
  tituloPedido.textContent = 'Nuevo pedido';
  btnCrearPedido.textContent = 'Confirmar pedido';
  btnLiberarMesa.style.display = 'none';
  formPedido.reset();
  renderPlatos();
  actualizarSubtotal();
  renderMesas();
}

function cargarPedidoEnFormulario(pedido) {
  cantidades = {};
  pedido.items.forEach((item) => {
    cantidades[item.platoId] = item.cantidad;
    const input = platosList.querySelector(`input[data-id="${item.platoId}"]`);
    if (input) input.value = item.cantidad;
  });

  pedidoActualId = pedido.id;
  modoEdicion = true;
  mesaSeleccionada = pedido.mesaId;
  selectMesero.value = String(pedido.meseroId);
  tituloPedido.textContent = `Editando mesa ${pedido.mesaId}`;
  btnCrearPedido.textContent = 'Guardar cambios';
  btnLiberarMesa.style.display = 'inline-flex';
  actualizarSubtotal();
  renderMesas();
}

function seleccionarMesa(id) {
  const mesas = obtenerMesas();
  const mesa = mesas.find((m) => m.id === id);
  if (!mesa) return;

  if (mesa.estado === 'libre') {
    resetFormulario();
    mesaSeleccionada = id;
    modoEdicion = false;
    tituloPedido.textContent = `Nuevo pedido - Mesa ${mesa.numero}`;
    renderMesas();
    validarFormulario();
    return;
  }

  if (mesa.estado === 'ocupada') {
    const pedido = obtenerPedidoPorMesa(id);
    if (pedido) {
      renderPlatos();
      cargarPedidoEnFormulario(pedido);
      showToast(`Editando pedido de Mesa ${mesa.numero}`);
    }
  }
}

function marcarMesaLibreYEliminarPedido() {
  if (!mesaSeleccionada) return;

  const mesas = obtenerMesas();
  const mesa = mesas.find((m) => m.id === mesaSeleccionada);
  if (mesa) mesa.estado = 'libre';
  guardarMesas(mesas);

  const pedidos = obtenerPedidos();
  const filtrados = pedidos.filter((p) => p.mesaId !== mesaSeleccionada || p.estado === 'entregado');
  guardarPedidos(filtrados);

  showToast('Mesa liberada y pedido eliminado');
  resetFormulario();
}

mesasGrid.addEventListener('click', (e) => {
  const mesaEl = e.target.closest('.mesa');
  if (!mesaEl) return;
  seleccionarMesa(Number(mesaEl.dataset.id));
});

mesasOcupadas.addEventListener('click', (e) => {
  const mesaEl = e.target.closest('.mesa');
  if (!mesaEl) return;
  seleccionarMesa(Number(mesaEl.dataset.id));
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
btnLiberarMesa.addEventListener('click', marcarMesaLibreYEliminarPedido);

formPedido.addEventListener('submit', (e) => {
  e.preventDefault();

  const platos = Storage.get(DB_KEYS.PLATOS) || [];
  const items = Object.entries(cantidades)
    .filter(([, cant]) => cant > 0)
    .map(([id, cant]) => {
      const plato = platos.find((p) => p.id === Number(id));
      return { platoId: plato.id, nombre: plato.nombre, precio: plato.precio, cantidad: cant };
    });

  const pedidos = obtenerPedidos();

  if (modoEdicion && pedidoActualId) {
    const pedido = pedidos.find((p) => p.id === pedidoActualId);
    if (!pedido) return;
    pedido.items = items;
    pedido.meseroId = Number(selectMesero.value);
    guardarPedidos(pedidos);
    showToast('Pedido actualizado');
  } else {
    const pedido = crearPedido({
      mesaId: mesaSeleccionada,
      meseroId: Number(selectMesero.value),
      items,
    });
    pedidos.push(pedido);
    guardarPedidos(pedidos);

    const mesas = obtenerMesas();
    const mesa = mesas.find((m) => m.id === mesaSeleccionada);
    if (mesa) {
      mesa.estado = 'ocupada';
      guardarMesas(mesas);
    }
    showToast(`Pedido creado. Subtotal: ${formatoMoneda(calcularSubtotalPedido(pedido))}`);
  }

  resetFormulario();
  renderMesas();
});

renderMesas();
renderMeseros();
renderPlatos();
/**
 * reservas.js
 * Vista Reservas: permite crear reservas anticipadas de mesas.
 * - Las mesas se bloquean automáticamente 2 horas antes de la reserva
 * - Muestra reservas activas y permite cancelarlas
 */

import { Storage, DB_KEYS } from '../utils/storage.js';
import { crearReserva, verificarReservaProxima } from '../data/models.js';
import { showToast } from '../app.js';
import { requireAuth } from '../auth.js';

requireAuth(['admin', 'mesero']);

const mesasDisponibles = document.getElementById('mesas-disponibles');
const reservasList = document.getElementById('reservas-list');
const selectMesa = document.getElementById('select-mesa');
const nombreClienteInput = document.getElementById('nombre-cliente');
const telefonoInput = document.getElementById('telefono');
const cantidadPersonasInput = document.getElementById('cantidad-personas');
const fechaHoraReservaInput = document.getElementById('fecha-hora-reserva');
const btnCrearReserva = document.getElementById('btn-crear-reserva');
const btnCancelarReserva = document.getElementById('btn-cancelar-reserva');
const formReserva = document.getElementById('form-reserva');
const tituloReserva = document.getElementById('titulo-reserva');

let reservaSeleccionada = null;
let modoEdicion = false;

function formatoFechaHora(isoString) {
  const fecha = new Date(isoString);
  return fecha.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function establecerMinFecha() {
  if (!fechaHoraReservaInput) return;
  
  const ahora = new Date();
  // Agregar 1 hora de margen mínimo para reservas
  ahora.setHours(ahora.getHours() + 1);
  
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  const hours = String(ahora.getHours()).padStart(2, '0');
  const minutes = String(ahora.getMinutes()).padStart(2, '0');
  
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  fechaHoraReservaInput.min = minDateTime;
}

function obtenerMesas() {
  return Storage.get(DB_KEYS.MESAS) || [];
}

function guardarMesas(mesas) {
  Storage.set(DB_KEYS.MESAS, mesas);
}

function obtenerReservas() {
  return Storage.get(DB_KEYS.RESERVAS) || [];
}

function guardarReservas(reservas) {
  Storage.set(DB_KEYS.RESERVAS, reservas);
}

function obtenerPedidos() {
  return Storage.get(DB_KEYS.PEDIDOS) || [];
}

function verificarMesaDisponible(mesaId, fechaHoraReserva) {
  const reservas = obtenerReservas();
  const pedidos = obtenerPedidos();
  
  // Verificar si hay una reserva activa para esta mesa en el mismo rango de tiempo
  const fechaReserva = new Date(fechaHoraReserva);
  const fechaInicio = new Date(fechaReserva.getTime() - 2 * 60 * 60 * 1000); // 2 horas antes
  const fechaFin = new Date(fechaReserva.getTime() + 2 * 60 * 60 * 1000); // 2 horas después
  
  const reservaConflicto = reservas.find(r => {
    if (r.mesaId !== mesaId || r.estado === 'cancelada' || r.estado === 'completada') return false;
    const fechaR = new Date(r.fechaHora);
    return fechaR >= fechaInicio && fechaR <= fechaFin;
  });
  
  if (reservaConflicto) {
    return { disponible: false, motivo: 'Ya existe una reserva para esta mesa en este horario' };
  }
  
  // Verificar si la mesa está ocupada actualmente
  const mesas = obtenerMesas();
  const mesa = mesas.find(m => m.id === mesaId);
  if (mesa && mesa.estado === 'ocupada') {
    return { disponible: false, motivo: 'La mesa está ocupada actualmente' };
  }
  
  return { disponible: true };
}

function actualizarEstadosMesas() {
  const mesas = obtenerMesas();
  const reservas = obtenerReservas();
  const ahora = new Date();
  
  let cambios = false;
  
  reservas.forEach(reserva => {
    if (reserva.estado !== 'activa') return;
    
    const fechaReserva = new Date(reserva.fechaHora);
    const tiempoRestante = fechaReserva - ahora;
    const dosHorasEnMs = 2 * 60 * 60 * 1000;
    
    // Si faltan 2 horas o menos, marcar la mesa como reservada
    if (tiempoRestante <= dosHorasEnMs && tiempoRestante > 0) {
      const mesa = mesas.find(m => m.id === reserva.mesaId);
      if (mesa && mesa.estado === 'libre') {
        mesa.estado = 'reservada';
        cambios = true;
      }
    }
    
    // Si la reserva ya pasó, marcarla como completada
    if (tiempoRestante <= 0) {
      reserva.estado = 'completada';
      cambios = true;
    }
  });
  
  if (cambios) {
    guardarMesas(mesas);
    guardarReservas(reservas);
  }
}

function renderMesasDisponibles() {
  actualizarEstadosMesas();
  const mesas = obtenerMesas();
  const disponibles = mesas.filter(m => m.estado === 'libre');
  
  mesasDisponibles.innerHTML = disponibles.length
    ? disponibles.map(m => `
        <div class="mesa mesa--libre ${reservaSeleccionada === m.id ? 'mesa--selected' : ''}" 
             data-id="${m.id}" role="button" tabindex="0">
          Mesa ${m.numero}<br><small>${m.capacidad} Personas</small>
        </div>`).join('')
    : '<p class="empty-state">No hay mesas disponibles para reserva</p>';
}

function renderSelectMesas() {
  actualizarEstadosMesas();
  const mesas = obtenerMesas();
  const disponibles = mesas.filter(m => m.estado === 'libre');
  
  selectMesa.innerHTML =
    '<option value="" disabled selected>Seleccione una mesa</option>' +
    disponibles.map(m => `<option value="${m.id}">Mesa ${m.numero} (${m.capacidad} personas)</option>`).join('');
}

function renderReservas() {
  const reservas = obtenerReservas();
  const activas = reservas.filter(r => r.estado === 'activa');
  const mesas = obtenerMesas();
  
  reservasList.innerHTML = activas.length
    ? activas.map(r => {
        const mesa = mesas.find(m => m.id === r.mesaId);
        const esProxima = verificarReservaProxima(r);
        const estadoClass = esProxima ? 'reserva--proxima' : 'reserva--activa';
        const estadoTexto = esProxima ? 'Próxima (mesa bloqueada)' : 'Activa';
        
        return `
          <div class="reserva-card ${estadoClass} ${reservaSeleccionada === r.id ? 'reserva--selected' : ''}" 
               data-id="${r.id}" role="button" tabindex="0">
            <div class="reserva-info">
              <strong>Mesa ${mesa ? mesa.numero : r.mesaId}</strong><br>
              <small>${r.nombreCliente} - ${r.telefono}</small><br>
              <small>${r.cantidadPersonas} personas</small><br>
              <small>${formatoFechaHora(r.fechaHora)}</small><br>
              <span class="reserva-estado">${estadoTexto}</span>
            </div>
          </div>`;
      }).join('')
    : '<p class="empty-state">No hay reservas activas</p>';
}

function validarFormulario() {
  const mesaSeleccionada = selectMesa.value;
  const nombre = nombreClienteInput.value.trim();
  const telefono = telefonoInput.value.trim();
  const cantidad = cantidadPersonasInput.value;
  const fechaHora = fechaHoraReservaInput.value;
  
  let todoValido = mesaSeleccionada && nombre && telefono && cantidad && fechaHora;
  
  // Validar fecha futura
  if (fechaHora) {
    const fechaSeleccionada = new Date(fechaHora);
    const ahora = new Date();
    ahora.setHours(ahora.getHours() + 1); // Mínimo 1 hora
    
    if (fechaSeleccionada < ahora) {
      todoValido = false;
    }
  }
  
  btnCrearReserva.disabled = !todoValido;
}

function resetFormulario() {
  reservaSeleccionada = null;
  modoEdicion = false;
  tituloReserva.textContent = 'Nueva reserva';
  btnCrearReserva.textContent = 'Confirmar reserva';
  btnCancelarReserva.style.display = 'none';
  formReserva.reset();
  if (fechaHoraReservaInput) {
    fechaHoraReservaInput.value = '';
    establecerMinFecha();
  }
  renderMesasDisponibles();
  renderSelectMesas();
  renderReservas();
  validarFormulario();
}

function seleccionarReserva(id) {
  const reservas = obtenerReservas();
  const reserva = reservas.find(r => r.id === id);
  if (!reserva) return;
  
  reservaSeleccionada = id;
  modoEdicion = true;
  
  selectMesa.value = String(reserva.mesaId);
  nombreClienteInput.value = reserva.nombreCliente;
  telefonoInput.value = reserva.telefono;
  cantidadPersonasInput.value = reserva.cantidadPersonas;
  fechaHoraReservaInput.value = reserva.fechaHora;
  
  tituloReserva.textContent = 'Editando reserva';
  btnCrearReserva.textContent = 'Guardar cambios';
  btnCancelarReserva.style.display = 'inline-flex';
  
  renderReservas();
  validarFormulario();
}

function cancelarReserva() {
  if (!reservaSeleccionada) return;
  
  const reservas = obtenerReservas();
  const reserva = reservas.find(r => r.id === reservaSeleccionada);
  if (reserva) {
    reserva.estado = 'cancelada';
    guardarReservas(reservas);
    
    // Liberar la mesa si estaba reservada
    const mesas = obtenerMesas();
    const mesa = mesas.find(m => m.id === reserva.mesaId);
    if (mesa && mesa.estado === 'reservada') {
      mesa.estado = 'libre';
      guardarMesas(mesas);
    }
    
    showToast('Reserva cancelada');
  }
  
  resetFormulario();
}

mesasDisponibles.addEventListener('click', (e) => {
  const mesaEl = e.target.closest('.mesa');
  if (!mesaEl) return;
  const mesaId = Number(mesaEl.dataset.id);
  selectMesa.value = String(mesaId);
  validarFormulario();
});

reservasList.addEventListener('click', (e) => {
  const reservaEl = e.target.closest('.reserva-card');
  if (!reservaEl) return;
  seleccionarReserva(Number(reservaEl.dataset.id));
});

selectMesa.addEventListener('change', validarFormulario);
nombreClienteInput.addEventListener('input', validarFormulario);
telefonoInput.addEventListener('input', validarFormulario);
cantidadPersonasInput.addEventListener('input', validarFormulario);

if (fechaHoraReservaInput) {
  fechaHoraReservaInput.addEventListener('change', validarFormulario);
  fechaHoraReservaInput.addEventListener('input', validarFormulario);
  
  const validarFechaFutura = () => {
    if (fechaHoraReservaInput.value) {
      const fechaSeleccionada = new Date(fechaHoraReservaInput.value);
      const ahora = new Date();
      ahora.setHours(ahora.getHours() + 1);
      
      if (fechaSeleccionada < ahora) {
        showToast('La fecha y hora deben ser al menos 1 hora en el futuro');
        fechaHoraReservaInput.value = '';
        validarFormulario();
        return false;
      }
    }
    return true;
  };
  
  fechaHoraReservaInput.addEventListener('change', validarFechaFutura);
  fechaHoraReservaInput.addEventListener('blur', validarFechaFutura);
}

btnCancelarReserva.addEventListener('click', cancelarReserva);

formReserva.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Validar fecha futura
  if (fechaHoraReservaInput && fechaHoraReservaInput.value) {
    const fechaSeleccionada = new Date(fechaHoraReservaInput.value);
    const ahora = new Date();
    ahora.setHours(ahora.getHours() + 1);
    
    if (fechaSeleccionada < ahora) {
      showToast('La fecha de reserva debe ser al menos 1 hora en el futuro');
      fechaHoraReservaInput.value = '';
      validarFormulario();
      return;
    }
  }
  
  const mesaId = Number(selectMesa.value);
  const nombreCliente = nombreClienteInput.value.trim();
  const telefono = telefonoInput.value.trim();
  const cantidadPersonas = Number(cantidadPersonasInput.value);
  const fechaHora = fechaHoraReservaInput.value;
  
  // Verificar disponibilidad de la mesa
  const disponibilidad = verificarMesaDisponible(mesaId, fechaHora);
  if (!disponibilidad.disponible) {
    showToast(disponibilidad.motivo);
    return;
  }
  
  const reservas = obtenerReservas();
  
  if (modoEdicion && reservaSeleccionada) {
    const reserva = reservas.find(r => r.id === reservaSeleccionada);
    if (!reserva) return;
    
    reserva.mesaId = mesaId;
    reserva.nombreCliente = nombreCliente;
    reserva.telefono = telefono;
    reserva.cantidadPersonas = cantidadPersonas;
    reserva.fechaHora = fechaHora;
    
    guardarReservas(reservas);
    showToast('Reserva actualizada');
  } else {
    const reserva = crearReserva({
      mesaId,
      nombreCliente,
      telefono,
      fechaHora,
      cantidadPersonas,
    });
    reservas.push(reserva);
    guardarReservas(reservas);
    showToast('Reserva creada exitosamente');
  }
  
  resetFormulario();
});

// Actualizar estados cada minuto para el bloqueo automático
setInterval(() => {
  actualizarEstadosMesas();
  renderMesasDisponibles();
  renderSelectMesas();
  renderReservas();
}, 60000);

establecerMinFecha();
renderMesasDisponibles();
renderSelectMesas();
renderReservas();

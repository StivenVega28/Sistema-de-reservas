/**
 * models.js
 * Fábricas y helpers para crear entidades consistentes.
 */

export function crearPedido({ mesaId, meseroId, items, fechaReserva }) {
  return {
    id: Date.now(),
    mesaId,
    meseroId,
    items, // [{ platoId, nombre, precio, cantidad }]
    estado: 'preparacion', // preparacion -> listo -> entregado
    propina: 0,
    fechaCreacion: new Date().toISOString(),
    fechaReserva: fechaReserva || null,
    fechaEntrega: null,
  };
}

export function crearReserva({ mesaId, nombreCliente, telefono, fechaHora, cantidadPersonas }) {
  return {
    id: Date.now(),
    mesaId,
    nombreCliente,
    telefono,
    fechaHora, // ISO string de la fecha y hora de la reserva
    cantidadPersonas,
    estado: 'activa', // activa | confirmada | cancelada | completada
    fechaCreacion: new Date().toISOString(),
  };
}

export function calcularSubtotalPedido(pedido) {
  return pedido.items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
}

export function verificarReservaProxima(reserva, horasAntes = 2) {
  const fechaReserva = new Date(reserva.fechaHora);
  const ahora = new Date();
  const tiempoRestante = fechaReserva - ahora;
  const horasEnMs = horasAntes * 60 * 60 * 1000;
  return tiempoRestante <= horasEnMs && tiempoRestante > 0;
}

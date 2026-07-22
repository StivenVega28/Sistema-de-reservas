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

export function calcularSubtotalPedido(pedido) {
  return pedido.items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
}

/**
 * app.js
 * Punto de entrada común a todas las vistas.
 * 1. Siembra datos iniciales en localStorage si no existen.
 * 2. Marca el link activo del navbar según la página actual.
 * 3. Expone helper global showToast() reutilizado por las vistas.
 */

import { seedDatabase } from './data/seed.js';

seedDatabase();

function marcarNavActivo() {
  const page = document.body.dataset.page ||
    location.pathname.split('/').pop().replace('.html', '') || 'index';
  document.querySelectorAll('.navbar__link').forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add('navbar__link--active');
    }
  });
}

export function showToast(mensaje, duracion = 2200) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('toast--show');
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.remove('toast--show');
  }, duracion);
}

document.addEventListener('DOMContentLoaded', marcarNavActivo);

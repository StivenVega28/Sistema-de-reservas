/**
 * app.js
 * Punto de entrada común a todas las vistas.
 * 1. Siembra datos iniciales en localStorage si no existen.
 * 2. Marca el link activo del navbar según la página actual.
 * 3. Muestra información de sesión y botón de logout.
 * 4. Expone helper global showToast() reutilizado por las vistas.
 */

import { seedDatabase } from './data/seed.js';
import { getSesion, logout } from './auth.js';

await seedDatabase();

const ACCESOS_POR_ROL = {
  admin: ['index', 'cocina', 'despacho', 'admin'],
  mesero: ['index', 'despacho'],
  cocina: ['cocina'],
  despacho: ['despacho'],
};

function marcarNavActivo() {
  const page =
    document.body.dataset.page ||
    location.pathname.split('/').pop().replace('.html', '') ||
    'index';

  document.querySelectorAll('.navbar__link').forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add('navbar__link--active');
    }
  });
}

function aplicarPermisosNavbar(rol) {
  const permitidos = ACCESOS_POR_ROL[rol] || [];
  document.querySelectorAll('.navbar__link').forEach((link) => {
    if (!permitidos.includes(link.dataset.page)) {
      link.style.display = 'none';
    }
  });
}

function mostrarSesion() {
  const sesion = getSesion();
  const navbar = document.querySelector('.navbar');
  if (!navbar || !sesion) return;

  const existingSession = navbar.querySelector('.navbar__session');
  if (existingSession) existingSession.remove();

  const sessionDiv = document.createElement('div');
  sessionDiv.className = 'navbar__session';
  sessionDiv.innerHTML = `
  <span class="navbar__usuario">${sesion.usuario}</span>
  <button id="btn-logout" class="btn btn--sm btn--danger">Cerrar sesión</button>
`;
  navbar.appendChild(sessionDiv);

  document.getElementById('btn-logout').addEventListener('click', logout);
  aplicarPermisosNavbar(sesion.rol);
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

document.addEventListener('DOMContentLoaded', () => {
  marcarNavActivo();
  mostrarSesion();
});
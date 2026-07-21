/**
 * storage.js
 * Módulo utilitario para centralizar el acceso a localStorage.
 * Todas las vistas deben usar estas funciones en lugar de llamar
 * a localStorage directamente, para mantener consistencia.
 */

const DB_KEYS = {
  MESAS: 'rr_mesas',
  MESEROS: 'rr_meseros',
  PLATOS: 'rr_platos',
  PEDIDOS: 'rr_pedidos',
};

const Storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`Error leyendo ${key} de localStorage`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error guardando ${key} en localStorage`, e);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clearAll() {
    Object.values(DB_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

export { Storage, DB_KEYS };

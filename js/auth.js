/** auth.js */
import { Storage, DB_KEYS } from './utils/storage.js';
import { verificarPassword } from './utils/crypto.js';
import { validarUsuario, validarPassword, sanitizarTexto } from './utils/validaciones.js';

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 30_000; // 30s
const SESION_DURACION_MS = 8 * 60 * 60 * 1000; // 8h

export const RUTAS_POR_ROL = {
  admin: 'admin.html',
  mesero: 'index.html',
  cocina: 'cocina.html',
  despacho: 'despacho.html',
};

export async function login(usuarioInput, passwordInput) {
  const usuario = sanitizarTexto(usuarioInput);
  const password = passwordInput;

  const valUsuario = validarUsuario(usuario);
  if (!valUsuario.valido) return { ok: false, mensaje: valUsuario.mensaje };

  const valPassword = validarPassword(password);
  if (!valPassword.valido) return { ok: false, mensaje: valPassword.mensaje };

  const usuarios = Storage.get(DB_KEYS.USUARIOS) || [];
  const registro = usuarios.find((u) => u.usuario === usuario);

  if (!registro) {
    return { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };
  }

  if (registro.bloqueadoHasta && Date.now() < registro.bloqueadoHasta) {
    const segundos = Math.ceil((registro.bloqueadoHasta - Date.now()) / 1000);
    return { ok: false, mensaje: `Cuenta bloqueada temporalmente. Intenta en ${segundos}s.` };
  }

  const passwordValida = await verificarPassword(password, registro.salt, registro.hash);

  if (!passwordValida) {
    registro.intentosFallidos = (registro.intentosFallidos || 0) + 1;
    if (registro.intentosFallidos >= MAX_INTENTOS) {
      registro.bloqueadoHasta = Date.now() + BLOQUEO_MS;
      registro.intentosFallidos = 0;
    }
    Storage.set(DB_KEYS.USUARIOS, usuarios);
    return { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };
  }

  registro.intentosFallidos = 0;
  registro.bloqueadoHasta = null;
  Storage.set(DB_KEYS.USUARIOS, usuarios);

  const sesion = {
    usuario: registro.usuario,
    rol: registro.rol,
    inicio: Date.now(),
    expira: Date.now() + SESION_DURACION_MS,
  };
  Storage.set(DB_KEYS.SESION, sesion);

  return { ok: true, mensaje: 'Inicio de sesión exitoso.', rol: registro.rol };
}

export function logout() {
  Storage.remove(DB_KEYS.SESION);
  window.location.href = 'login.html';
}

export function getSesion() {
  const sesion = Storage.get(DB_KEYS.SESION);
  if (!sesion) return null;
  if (Date.now() > sesion.expira) {
    Storage.remove(DB_KEYS.SESION);
    return null;
  }
  return sesion;
}

export function requireAuth(rolesPermitidos = []) {
  const sesion = getSesion();
  if (!sesion) {
    window.location.href = 'login.html';
    return null;
  }
  if (rolesPermitidos.length && !rolesPermitidos.includes(sesion.rol)) {
    window.location.href = RUTAS_POR_ROL[sesion.rol] || 'login.html';
    return null;
  }
  return sesion;
}

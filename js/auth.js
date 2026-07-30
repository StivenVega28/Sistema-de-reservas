/** auth.js */
import { api } from './services/api.js';
import { validarUsuario, validarPassword, sanitizarTexto } from './utils/validaciones.js';

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

  try {
    // Usar email o usuario para login
    const email = usuario.includes('@') ? usuario : `${usuario}@restaurante.com`;
    const response = await api.login(email, password);

    if (response.user) {
      // Guardar datos de sesión en localStorage para compatibilidad
      const sesion = {
        usuario: response.user.usuario,
        rol: response.user.role,
        email: response.user.email,
        name: response.user.name,
        inicio: Date.now(),
      };
      localStorage.setItem('sesion', JSON.stringify(sesion));

      return { 
        ok: true, 
        mensaje: 'Inicio de sesión exitoso.', 
        rol: response.user.role,
        user: response.user
      };
    }

    return { ok: false, mensaje: 'Error en el login' };
  } catch (error) {
    return { ok: false, mensaje: error.message || 'Usuario o contraseña incorrectos.' };
  }
}

export async function logout() {
  try {
    await api.logout();
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    localStorage.removeItem('sesion');
    window.location.href = 'login.html';
  }
}

export function getSesion() {
  const sesionStr = localStorage.getItem('sesion');
  if (!sesionStr) return null;
  
  try {
    const sesion = JSON.parse(sesionStr);
    return sesion;
  } catch (error) {
    localStorage.removeItem('sesion');
    return null;
  }
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

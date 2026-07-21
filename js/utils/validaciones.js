/** validaciones.js */
const USUARIO_REGEX = /^[a-zA-Z0-9_]{4,20}$/;
const PASSWORD_MIN_LENGTH = 8;

export function validarUsuario(usuario) {
  if (!usuario || typeof usuario !== 'string') {
    return { valido: false, mensaje: 'El usuario es obligatorio.' };
  }
  if (!USUARIO_REGEX.test(usuario)) {
    return {
      valido: false,
      mensaje:
        'El usuario debe tener entre 4 y 20 caracteres, sin espacios ni símbolos (solo letras, números y "_").',
    };
  }
  return { valido: true, mensaje: '' };
}

export function validarPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valido: false, mensaje: 'La contraseña es obligatoria.' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valido: false, mensaje: `La contraseña debe tener mínimo ${PASSWORD_MIN_LENGTH} caracteres.` };
  }
  if (!/[A-Z]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe incluir al menos una letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe incluir al menos un número.' };
  }
  if (/\s/.test(password)) {
    return { valido: false, mensaje: 'La contraseña no puede contener espacios.' };
  }
  return { valido: true, mensaje: '' };
}

export function sanitizarTexto(texto) {
  if (typeof texto !== 'string') return texto;
  return texto.replace(/[<>]/g, '').trim();
}

/** validaciones.js */
const USUARIO_REGEX = /^[a-zA-Z0-9_]{4,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export function validarUsuario(usuario) {
  if (!usuario || typeof usuario !== 'string') {
    return { valido: false, mensaje: 'El usuario es obligatorio.' };
  }
  
  // Aceptar formato de usuario normal o email
  const esEmail = usuario.includes('@');
  const regexValido = esEmail ? EMAIL_REGEX.test(usuario) : USUARIO_REGEX.test(usuario);
  
  if (!regexValido) {
    if (esEmail) {
      return {
        valido: false,
        mensaje: 'El formato del email no es válido.',
      };
    }
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
  // Validaciones relajadas - solo verificar longitud
  return { valido: true, mensaje: '' };
}

export function sanitizarTexto(texto) {
  if (typeof texto !== 'string') return texto;
  return texto.replace(/[<>]/g, '').trim();
}

import { login, getSesion, RUTAS_POR_ROL } from '../auth.js';
import { validarUsuario, validarPassword } from '../utils/validaciones.js';

const form = document.getElementById('form-login');
const inputUsuario = document.getElementById('input-usuario');
const inputPassword = document.getElementById('input-password');
const errorEl = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');
const btnToggle = document.getElementById('btn-toggle-password');

const sesionActiva = getSesion();
if (sesionActiva) {
  window.location.href = RUTAS_POR_ROL[sesionActiva.rol] || 'index.html';
}

function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.classList.toggle('login-error--visible', Boolean(mensaje));
}

function validarEnVivo() {
  const usuario = inputUsuario.value.trim();
  const password = inputPassword.value;
  const valUsuario = validarUsuario(usuario);
  const valPassword = validarPassword(password);

  inputUsuario.classList.toggle('form-control--invalid', usuario.length > 0 && !valUsuario.valido);
  inputPassword.classList.toggle('form-control--invalid', password.length > 0 && !valPassword.valido);

  btnLogin.disabled = !(valUsuario.valido && valPassword.valido);
}

inputUsuario.addEventListener('input', () => {
  // No restringir caracteres, dejar que la validación maneje el formato
  mostrarError('');
  validarEnVivo();
});

inputPassword.addEventListener('input', () => {
  mostrarError('');
  validarEnVivo();
});

btnToggle.addEventListener('click', () => {
  const esPassword = inputPassword.type === 'password';
  inputPassword.type = esPassword ? 'text' : 'password';
  btnToggle.textContent = esPassword ? '🙈' : '👁';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarError('');
  btnLogin.disabled = true;
  btnLogin.textContent = 'Verificando...';

  const resultado = await login(inputUsuario.value.trim(), inputPassword.value);

  if (!resultado.ok) {
    mostrarError(resultado.mensaje);
    btnLogin.disabled = false;
    btnLogin.textContent = 'Ingresar';
    inputPassword.value = '';
    return;
  }

  window.location.href = RUTAS_POR_ROL[resultado.rol] || 'index.html';
});

validarEnVivo();

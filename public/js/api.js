/**
 * API Helper — maneja peticiones al backend.
 * Almacena token en localStorage y lo envía como Bearer.
 */
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  async request(method, path, body = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const token = this.getToken();
    if (token) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(this.baseUrl + path, opts);

    if (res.status === 401) {
      this.removeToken();
      window.location.href = '/login';
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  delete(path) { return this.request('DELETE', path); },

  // Auth
  async login(username, password) {
    const data = await this.post('/auth/login', { username, password });
    if (data.ok) {
      this.setToken(data.token);
      this.setUser(data.user);
    }
    return data;
  },

  async logout() {
    try { await this.post('/auth/logout'); } catch(e) {}
    this.removeToken();
    window.location.href = '/login';
  },

  // Redirect basado en rol
  redirectByRole(user) {
    const routes = {
      administrador: '/admin',
      mesero: '/mesero',
      cocina: '/cocina',
      despachador: '/despacho'
    };
    window.location.href = routes[user.rol] || '/login';
  },

  // Verificar autenticacion
  checkAuth(allowedRoles) {
    const user = this.getUser();
    const token = this.getToken();
    if (!user || !token) {
      window.location.href = '/login';
      return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      this.redirectByRole(user);
      return null;
    }
    return user;
  },

  // Cierra sesion automaticamente despues de inactividad.
  startInactivityLogout(minutes = 3) {
    if (!this.getToken() || window.location.pathname === '/login') return;

    const timeoutMs = minutes * 60 * 1000;
    let timer = null;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.removeToken();
        window.location.href = '/login?reason=inactive';
      }, timeoutMs);
    };

    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(eventName => {
      document.addEventListener(eventName, resetTimer, { passive: true });
    });

    resetTimer();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  API.startInactivityLogout(3);
});

// ============================================================
// TOAST Notifications
// ============================================================
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

// ============================================================
// MODAL Helper
// ============================================================
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ============================================================
// SIDEBAR Toggle
// ============================================================
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// Close sidebar when clicking overlay on mobile
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !e.target.classList.contains('menu-toggle')) {
    sidebar.classList.remove('open');
  }
});

// ============================================================
// FORMAT helpers
// ============================================================
function formatMoney(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CO');
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('es-CO');
}

function formatTime(t) {
  if (!t) return '';
  return t.substring(0, 5);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `Hace ${hrs}h ${mins % 60}min`;
}

// Badge helper
function estadoBadge(estado) {
  const map = {
    disponible: 'badge-success',
    reservada: 'badge-warning',
    ocupada: 'badge-danger',
    pendiente: 'badge-warning',
    confirmada: 'badge-info',
    en_mesa: 'badge-primary',
    completada: 'badge-success',
    cancelada: 'badge-gray',
    no_show: 'badge-danger',
    abierto: 'badge-info',
    en_preparacion: 'badge-warning',
    listo: 'badge-success',
    entregado: 'badge-success',
    cerrado: 'badge-gray',
    cancelado: 'badge-gray',
    en_ruta: 'badge-warning',
    pagada: 'badge-success',
    anulada: 'badge-danger',
    abierta: 'badge-info'
  };
  return `<span class="badge ${map[estado] || 'badge-gray'}">${estado.replace(/_/g, ' ')}</span>`;
}

// Tab switching
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('.tabs').parentElement;
      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      tabGroup.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
      btn.dispatchEvent(new CustomEvent('tab:shown', { bubbles: true, detail: { tab: btn.dataset.tab } }));
    });
  });
}

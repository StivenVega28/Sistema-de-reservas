/**
 * api.js
 * Servicio de API para comunicarse con el backend
 * Maneja autenticación, refresh tokens y llamadas HTTP
 */

const API_BASE = 'http://localhost:4000/api';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken') || null;
  }

  // Guardar access token
  setAccessToken(token) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  // Limpiar tokens
  clearTokens() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  // Obtener headers con autenticación
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Request genérico con manejo de errores
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      },
      credentials: 'include' // Para cookies de refresh token
    };

    try {
      const response = await fetch(url, config);

      // Si el token expiró (401), intentar refresh
      if (response.status === 401 && !options._skipRefresh) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Reintentar la petición original
          return this.request(endpoint, { ...options, _skipRefresh: true });
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la petición');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Métodos HTTP helper
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.accessToken) {
      this.setAccessToken(response.accessToken);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout', {});
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken() {
    try {
      const response = await this.post('/auth/refresh-token', {});
      if (response.accessToken) {
        this.setAccessToken(response.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refrescando token:', error);
      this.clearTokens();
      return false;
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // Reservations methods
  async getReservations() {
    return this.get('/auth/reservations');
  }

  async createReservation(data) {
    return this.post('/auth/reservations', data);
  }

  async updateReservationStatus(id, status) {
    return this.put(`/auth/reservations/${id}/status`, { status });
  }

  // Role management (admin only)
  async changeUserRole(userId, newRole) {
    return this.post('/auth/admin/change-role', { userId, newRole });
  }
}

// Exportar instancia única
export const api = new ApiService();

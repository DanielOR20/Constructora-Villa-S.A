import axios from 'axios';

/**
 * =============================================================================
 * CLIENTE AXIOS CENTRALIZADO CON AUTENTICACIÓN JWT
 * Gestión de Inventarios - Constructora Del Valle S.A.
 * Conexión base: http://localhost:4000/api
 * =============================================================================
 */

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000 // 10 segundos
});

// Interceptor para inyectar automáticamente el token JWT Bearer si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_jwt_constructora');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejo uniforme de errores de red o backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.error?.mensaje ||
      error.response?.data?.message ||
      error.message ||
      'Error desconocido al comunicar con el servidor backend.';
    console.error('[API Client Error]:', errorMsg);
    return Promise.reject(error);
  }
);

/* =============================================================================
 * 1. SERVICIOS DE AUTENTICACIÓN (JWT & RBAC)
 * ============================================================================= */

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data?.data?.token) {
    localStorage.setItem('token_jwt_constructora', response.data.data.token);
    localStorage.setItem('usuario_constructora', JSON.stringify(response.data.data.usuario));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token_jwt_constructora');
  localStorage.removeItem('usuario_constructora');
};

export const getUsuarioSesion = () => {
  try {
    const user = localStorage.getItem('usuario_constructora');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getPerfilActual = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getUsuarios = async () => {
  const response = await api.get('/auth/usuarios');
  return response.data;
};

/* =============================================================================
 * 2. SERVICIOS DE MATERIALES
 * ============================================================================= */

export const getMateriales = async () => {
  const response = await api.get('/materiales');
  return response.data;
};

export const getMaterialById = async (id) => {
  const response = await api.get(`/materiales/${id}`);
  return response.data;
};

export const getStockIndividual = async (id) => {
  const response = await api.get(`/materiales/${id}/stock`);
  return response.data;
};

export const getReordenPorMaterial = async (id) => {
  const response = await api.get(`/materiales/${id}/reorden`);
  return response.data;
};

export const createMaterial = async (data) => {
  const response = await api.post('/materiales', data);
  return response.data;
};

/* =============================================================================
 * 3. SERVICIOS DE MOVIMIENTOS E INVENTARIO
 * ============================================================================= */

export const getMovimientos = async (limit = 50, tipo = null) => {
  const params = {};
  if (limit) params.limit = limit;
  if (tipo) params.tipo = tipo;
  const response = await api.get('/movimientos', { params });
  return response.data;
};

export const registrarMovimiento = async (data) => {
  const response = await api.post('/movimientos', data);
  return response.data;
};

export const getStockPorUbicacion = async () => {
  const response = await api.get('/movimientos/stock/ubicaciones');
  return response.data;
};

/* =============================================================================
 * 4. SERVICIOS DE ALERTAS, REORDEN Y AUDITORÍA
 * ============================================================================= */

export const getAlertasResumen = async () => {
  const response = await api.get('/alertas/resumen');
  return response.data;
};

export const getAlertasReorden = async () => {
  const response = await api.get('/alertas/reorden');
  return response.data;
};

export const getAlertasCriticos = async () => {
  const response = await api.get('/alertas/reorden/criticos');
  return response.data;
};

export const getAlertasAdvertencias = async () => {
  const response = await api.get('/alertas/reorden/advertencias');
  return response.data;
};

export const getAlertasDuplicados = async (dias = 3, tolerancia = 0.10) => {
  const response = await api.get('/alertas/duplicados', {
    params: { dias, tolerancia }
  });
  return response.data;
};

/* =============================================================================
 * 5. SERVICIOS DE ÓRDENES DE COMPRA & MATRIZ DE APROBACIÓN
 * ============================================================================= */

export const getOrdenes = async (estado_aprobacion = null) => {
  const params = {};
  if (estado_aprobacion) params.estado_aprobacion = estado_aprobacion;
  const response = await api.get('/ordenes', { params });
  return response.data;
};

export const getOrdenById = async (id) => {
  const response = await api.get(`/ordenes/${id}`);
  return response.data;
};

export const crearOrden = async (data) => {
  const response = await api.post('/ordenes', data);
  return response.data;
};

export const aprobarOrden = async (id, accion, motivo = '') => {
  const response = await api.patch(`/ordenes/${id}/aprobar`, { accion, motivo });
  return response.data;
};

export default api;

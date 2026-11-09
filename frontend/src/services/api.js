import axios from 'axios';

/**
 * =============================================================================
 * CLIENTE AXIOS CENTRALIZADO
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
 * 1. SERVICIOS DE MATERIALES
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
 * 2. SERVICIOS DE MOVIMIENTOS E INVENTARIO
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
 * 3. SERVICIOS DE ALERTAS, REORDEN Y AUDITORÍA
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
 * 4. SERVICIOS DE ÓRDENES DE COMPRA
 * ============================================================================= */

export const getOrdenes = async () => {
  const response = await api.get('/ordenes');
  return response.data;
};

export const getOrdenById = async (id) => {
  const response = await api.get(`/ordenes/${id}`);
  return response.data;
};

export default api;

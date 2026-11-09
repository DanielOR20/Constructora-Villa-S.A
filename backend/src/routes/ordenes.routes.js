const { Router } = require('express');
const {
  getOrdenes,
  getOrdenById,
  crearOrden,
  aprobarOrden,
  getOrdenesDuplicadas
} = require('../controllers/ordenes.controller');
const { verifyToken, requireRoles } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * =============================================================================
 * RUTAS DE ÓRDENES DE COMPRA & MATRIZ DE APROBACIÓN JERÁRQUICA
 * Prefijo: /api/ordenes
 * =============================================================================
 */

// Auditoría de compras duplicadas y fugas de valor
router.get('/duplicadas', getOrdenesDuplicadas);

// Listar todas las órdenes de compra (opcionalmente filtradas por estado_aprobacion)
router.get('/', getOrdenes);

// Obtener orden específica por ID con sus partidas y trazabilidad
router.get('/:id', getOrdenById);

// Registrar nueva orden de compra (aplica la Matriz de Aprobación según el monto)
router.post('/', crearOrden);

// Endpoint protegido con RBAC: Aprobar o rechazar orden verificando token JWT y roles autorizados
router.patch(
  '/:id/aprobar',
  verifyToken,
  requireRoles('jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general'),
  aprobarOrden
);

module.exports = router;

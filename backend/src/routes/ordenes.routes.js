const { Router } = require('express');
const {
  getOrdenes,
  getOrdenById,
  crearOrden,
  aprobarOrden,
  getOrdenesDuplicadas
} = require('../controllers/ordenes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * =============================================================================
 * RUTAS DE ÓRDENES DE COMPRA & MATRIZ DE APROBACIÓN JERÁRQUICA
 * Prefijo: /api/ordenes
 * =============================================================================
 */

// Auditoría de compras duplicadas
router.get('/duplicadas', getOrdenesDuplicadas);

// Listar todas las órdenes de compra (opcionalmente filtradas por estado_aprobacion)
router.get('/', getOrdenes);

// Obtener orden específica por ID con sus partidas y trazabilidad
router.get('/:id', getOrdenById);

// Registrar nueva orden de compra (aplica la Matriz de Aprobación según el monto)
router.post('/', crearOrden);

// Endpoint protegido: Aprobar o rechazar orden de compra verificando jerarquía JWT
router.patch('/:id/aprobar', verifyToken, aprobarOrden);

module.exports = router;
